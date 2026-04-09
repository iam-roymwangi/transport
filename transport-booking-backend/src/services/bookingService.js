const prisma = require("../config/db");
const normalizeDate = require("../utils/normalizeDate");
const cleanString = require("../utils/cleanString");

/**
 * Insert a single booking, returns { booking } or throws on duplicate
 */
async function createBooking(data) {
  const dateISO = normalizeDate(data.date);

  return prisma.booking.create({
    data: {
      name: cleanString(data.name),
      staffNumber: cleanString(data.staffNumber),
      phoneNumber: cleanString(data.phoneNumber),
      location: cleanString(data.location),
      route: cleanString(data.route),
      shift: cleanString(data.shift),
      date: new Date(dateISO),
      address: cleanString(data.address),
      process: cleanString(data.process),
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

  return {
    date: dateStr,
    total: bookings.length,
    byShift,
    byLocation,
  };
}

module.exports = { createBooking, getBookingsByDate, getSummaryByDate };
