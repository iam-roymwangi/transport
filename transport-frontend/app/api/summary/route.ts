import { NextRequest, NextResponse } from 'next/server'
import { getSummaryByDate } from '@/lib/bookingService'

// GET /api/summary?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) {
    return NextResponse.json(
      { success: false, message: "Query param 'date' is required (YYYY-MM-DD)" },
      { status: 400 }
    )
  }

  try {
    const summary = await getSummaryByDate(date)
    return NextResponse.json(summary)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Failed to fetch summary' }, { status: 500 })
  }
}
