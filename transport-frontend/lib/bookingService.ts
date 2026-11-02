import { prisma } from './prisma';
import { normalizeDate } from './normalizeDate';
import { extractCoordinates, buildGoogleMapsUrl } from './googleMaps';

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export interface BookingInput {
  name: unknown;
  bmsNumber?: unknown;
  staffNumber?: unknown;
  phoneNumber?: unknown;
  role?: unknown;
  location?: unknown;
  route?: unknown;
  shift: unknown;
  date: unknown;
  address?: unknown;
  process?: unknown;
  pinLocation?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  googleMapsUrl?: unknown;
}

export async function createBooking(data: BookingInput) {
  const staffNumInput = clean(data.staffNumber);
  const bmsNumInput = clean(data.bmsNumber);

  // Look up staff by BMS number or Staff number
  let existingStaff = null;
  if (bmsNumInput) {
    existingStaff = await prisma.staff.findFirst({
      where: { bmsNumber: bmsNumInput },
    });
  }

  if (!existingStaff && staffNumInput) {
    existingStaff = await prisma.staff.findFirst({
      where: { staffNumber: staffNumInput },
    });
  }

  const staffNum = staffNumInput || existingStaff?.staffNumber || bmsNumInput || 'UNKNOWN';
  const bmsNumber = bmsNumInput || existingStaff?.bmsNumber || null;
  const role = clean(data.role) || existingStaff?.role || 'Agent';
  const address = clean(data.address) || existingStaff?.address || null;
  const location = clean(data.location) || existingStaff?.location || null;
  const route = clean(data.route) || existingStaff?.route || null;
  const process = clean(data.process) || existingStaff?.process || null;
  const phoneNumber = clean(data.phoneNumber) || existingStaff?.phoneNumber || null;

  // Coordinate resolution
  let pinLocation = clean(data.pinLocation) || existingStaff?.pinLocation || null;
  let googleMapsUrl = clean(data.googleMapsUrl) || existingStaff?.googleMapsUrl || null;
  let lat = data.latitude !== undefined && data.latitude !== null && data.latitude !== ''
    ? parseFloat(String(data.latitude))
    : existingStaff?.latitude ?? null;
  let lng = data.longitude !== undefined && data.longitude !== null && data.longitude !== ''
    ? parseFloat(String(data.longitude))
    : existingStaff?.longitude ?? null;

  // If lat/lng missing, try extracting from googleMapsUrl or pinLocation
  if ((lat === null || isNaN(lat)) && googleMapsUrl) {
    const coords = extractCoordinates(googleMapsUrl);
    if (coords) {
      lat = coords.latitude;
      lng = coords.longitude;
    }
  }

  if ((lat === null || isNaN(lat)) && pinLocation) {
    const coords = extractCoordinates(pinLocation);
    if (coords) {
      lat = coords.latitude;
      lng = coords.longitude;
    }
  }

  // If coordinates exist, ensure googleMapsUrl and pinLocation are built if absent
  if (lat !== null && !isNaN(lat) && lng !== null && !isNaN(lng)) {
    if (!googleMapsUrl) {
      googleMapsUrl = buildGoogleMapsUrl(lat, lng);
    }
    if (!pinLocation) {
      pinLocation = `${lat}, ${lng}`;
    }
  }

  return prisma.booking.create({
    data: {
      name: clean(data.name)!,
      bmsNumber,
      staffNumber: staffNum,
      phoneNumber,
      role,
      location,
      route,
      shift: clean(data.shift)!,
      date: normalizeDate(data.date),
      address,
      process,
      pinLocation,
      latitude: lat !== null && !isNaN(lat) ? lat : null,
      longitude: lng !== null && !isNaN(lng) ? lng : null,
      googleMapsUrl,
    },
  });
}

export async function getBookingsByDate(dateStr: string) {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setUTCHours(23, 59, 59, 999);

  return prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { shift: 'asc' },
  });
}

export async function getSummaryByDate(dateStr: string) {
  const bookings = await getBookingsByDate(dateStr);

  const byShift = bookings.reduce<Record<string, number>>((acc, b) => {
    const key = b.shift ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const byLocation = bookings.reduce<Record<string, number>>((acc, b) => {
    const key = b.location ?? 'Unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const byRole = bookings.reduce<Record<string, number>>((acc, b) => {
    const key = b.role ?? 'Agent';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return { date: dateStr, total: bookings.length, byShift, byLocation, byRole };
}
