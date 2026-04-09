import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createBooking } from '@/lib/bookingService'
import { Prisma } from '@prisma/client'

// Microsoft Forms column → model field mapping
const FIELD_MAP: Record<string, string> = {
  'Name': 'name',
  'Staff Number': 'staffNumber',
  'Phone Number': 'phoneNumber',
  'Location': 'location',
  'Route': 'route',
  'Pickup/Dropoff time': 'shift',
  'Pickup/Dropoff date': 'date',
  'Address': 'address',
  'Process': 'process',
}

function mapRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {}
  for (const [formField, modelField] of Object.entries(FIELD_MAP)) {
    mapped[modelField] = row[formField] ?? null
  }
  return mapped
}

// POST /api/import-bookings  (multipart/form-data, field: "file")
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName])

  let inserted = 0
  const duplicates: unknown[] = []

  for (const row of rows) {
    const data = mapRow(row)

    if (!data.name || !data.staffNumber || !data.shift || !data.date) {
      console.warn('Skipping incomplete row:', row)
      continue
    }

    try {
      await createBooking(data as unknown as Parameters<typeof createBooking>[0])
      inserted++
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        console.log(`Duplicate skipped: ${data.staffNumber} on ${data.date} shift ${data.shift}`)
        duplicates.push({ staffNumber: data.staffNumber, date: data.date, shift: data.shift, name: data.name })
      } else {
        throw err
      }
    }
  }

  return NextResponse.json({ success: true, inserted, duplicates })
}
