import { prisma } from './prisma'
import { normalizeDate } from './normalizeDate'

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

export interface BookingInput {
  name: unknown
  staffNumber: unknown
  phoneNumber?: unknown
  location?: unknown
  route?: unknown
  shift: unknown
  date: unknown
  address?: unknown
  process?: unknown
}

export async function createBooking(data: BookingInput) {
  return prisma.booking.create({
    data: {
      name: clean(data.name)!,
      staffNumber: clean(data.staffNumber)!,
      phoneNumber: clean(data.phoneNumber),
      location: clean(data.location),
      route: clean(data.route),
      shift: clean(data.shift)!,
      date: normalizeDate(data.date),
      address: clean(data.address),
      process: clean(data.process),
    },
  })
}

export async function getBookingsByDate(dateStr: string) {
  const start = new Date(dateStr)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(dateStr)
  end.setUTCHours(23, 59, 59, 999)

  return prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { shift: 'asc' },
  })
}

export async function getSummaryByDate(dateStr: string) {
  const bookings = await getBookingsByDate(dateStr)

  const byShift = bookings.reduce<Record<string, number>>((acc, b) => {
    const key = b.shift ?? 'Unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const byLocation = bookings.reduce<Record<string, number>>((acc, b) => {
    const key = b.location ?? 'Unknown'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return { date: dateStr, total: bookings.length, byShift, byLocation }
}
