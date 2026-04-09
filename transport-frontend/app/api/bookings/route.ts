import { NextRequest, NextResponse } from 'next/server'
import { createBooking, getBookingsByDate } from '@/lib/bookingService'
import { Prisma } from '@prisma/client'

// GET /api/bookings?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json(
      { success: false, message: "Query param 'date' is required (YYYY-MM-DD)" },
      { status: 400 }
    )
  }

  try {
    const bookings = await getBookingsByDate(date)
    return NextResponse.json(bookings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, staffNumber, shift, date } = body

  if (!name || !staffNumber || !shift || !date) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: name, staffNumber, shift, date' },
      { status: 400 }
    )
  }

  try {
    const booking = await createBooking(body)
    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Duplicate booking: You already booked this shift on this date.', error: 'DUPLICATE_BOOKING' },
        { status: 409 }
      )
    }
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
