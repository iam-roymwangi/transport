import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/bookings/monthly?year=2026&month=4
// Returns { "2026-04-09": 12, "2026-04-10": 5, ... }
export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? '')
  const month = parseInt(req.nextUrl.searchParams.get('month') ?? '')

  if (isNaN(year) || isNaN(month)) {
    return NextResponse.json(
      { success: false, message: 'year and month query params are required' },
      { status: 400 }
    )
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
    select: { date: true },
  })

  // Aggregate counts by date string YYYY-MM-DD
  const counts: Record<string, number> = {}
  for (const b of bookings) {
    const key = b.date.toISOString().split('T')[0]
    counts[key] = (counts[key] ?? 0) + 1
  }

  return NextResponse.json(counts)
}
