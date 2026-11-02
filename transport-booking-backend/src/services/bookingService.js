const prisma = require("../config/db");
const normalizeDate = require("../utils/normalizeDate");
const cleanString = require("../utils/cleanString");

/**
 * Insert a single booking, returns { booking } or throws on duplicate
 */
async function createBooking(data) {
  const dateISO = normalizeDate(data.date);
  const staffNumInput = cleanString(data.staffNumber);
  const bmsNumInput = cleanString(data.bmsNumber);

  // Look up staff if exists to pull transport details & BMS/role
  let staff = null;
  if (bmsNumInput) {
    staff = await prisma.staff.findFirst({
      where: { bmsNumber: bmsNumInput },
    });
  }

  if (!staff && staffNumInput) {
    staff = await prisma.staff.findFirst({
      where: { staffNumber: staffNumInput },
    });
  }

  const staffNum = staffNumInput || staff?.staffNumber || bmsNumInput || "UNKNOWN";
  const bmsNumber = bmsNumInput || staff?.bmsNumber || null;
  const role = cleanString(data.role) || staff?.role || "Agent";
  const location = cleanString(data.location) || staff?.location || null;
  const route = cleanString(data.route) || staff?.route || null;
  const address = cleanString(data.address) || staff?.address || null;
  const phoneNumber = cleanString(data.phoneNumber) || staff?.phoneNumber || null;
  const process = cleanString(data.process) || staff?.process || null;
  const pinLocation = cleanString(data.pinLocation) || staff?.pinLocation || null;
  const googleMapsUrl = cleanString(data.googleMapsUrl) || staff?.googleMapsUrl || null;
  const latitude = data.latitude !== undefined && data.latitude !== null ? parseFloat(data.latitude) : (staff?.latitude ?? null);
  const longitude = data.longitude !== undefined && data.longitude !== null ? parseFloat(data.longitude) : (staff?.longitude ?? null);

  return prisma.booking.create({
    data: {
      name: cleanString(data.name),
      bmsNumber,
      staffNumber: staffNum,
      phoneNumber,
      role,
      location,
      route,
      shift: cleanString(data.shift),
      date: new Date(dateISO),
      address,
      process,
      pinLocation,
      latitude,
      longitude,
      googleMapsUrl,
    },
  });
}

/**
 * Get all bookings for a given date, grouped by shift
 */
async function getBookingsByDate(dateStr) {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { shift: "asc" },
  });

  // Group by shift
  const shifts = bookings.reduce((acc, booking) => {
    const key = booking.shift || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {});

  return { date: dateStr, shifts };
}

/**
 * Get summary stats for a given date
 */
async function getSummaryByDate(dateStr) {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const byShift = bookings.reduce((acc, b) => {
    const key = b.shift || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byLocation = bookings.reduce((acc, b) => {
    const key = b.location || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const byRole = bookings.reduce((acc, b) => {
    const key = b.role || "Agent";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    date: dateStr,
    total: bookings.length,
    byShift,
    byLocation,
    byRole,
  };
}

async function getMyBookings(identifier) {
  return prisma.booking.findMany({
    where: {
      OR: [
        { staffNumber: identifier.toUpperCase() },
        { bmsNumber: identifier },
      ],
    },
    orderBy: { date: "desc" },
  });
}

async function updateBooking(id, data) {
  let parsedData = { ...data };
  if (parsedData.date) {
    parsedData.date = new Date(normalizeDate(parsedData.date));
  }

  return prisma.booking.update({
    where: { id },
    data: parsedData,
  });
}

async function deleteBookings(ids) {
  return prisma.booking.deleteMany({
    where: {
      id: { in: ids },
    },
  });
}

module.exports = {
  createBooking,
  getBookingsByDate,
  getSummaryByDate,
  getMyBookings,
  updateBooking,
  deleteBookings,
};
