import * as XLSX from 'xlsx'
import { Booking } from '@/components/booking-card'

/**
 * Exports filtered bookings grouped by shift to an Excel file.
 * Each shift gets a header block with driver/car assignment rows,
 * followed by the booking rows, then a blank spacer row.
 */
export function exportBookingsToExcel(
  groupedByShift: Record<string, Booking[]>,
  date: string
) {
  const wb = XLSX.utils.book_new()
  const rows: unknown[][] = []

  // ── Title ──────────────────────────────────────────────────────────────────
  rows.push([`Transport Bookings — ${date}`])
  rows.push([`Generated: ${new Date().toLocaleString()}`])
  rows.push([]) // blank

  const sortedShifts = Object.keys(groupedByShift).sort((a, b) => {
    const parse = (s: string) =>
      parseInt(s.split(' - ')[0].replace(/[:/]/g, '').slice(0, 4))
    return parse(a) - parse(b)
  })

  for (const shift of sortedShifts) {
    const bookings = groupedByShift[shift]

    // ── Shift heading ─────────────────────────────────────────────────────────
    rows.push([`SHIFT: ${shift}`, '', '', '', '', '', `Total: ${bookings.length}`])

    // ── Driver / Car assignment rows ──────────────────────────────────────────
    rows.push(['Driver:', '', '', 'Car / Vehicle:', '', '', ''])
    rows.push([]) // blank line for writing space

    // ── Column headers ────────────────────────────────────────────────────────
    rows.push([
      '#',
      'Name',
      'Staff No.',
      'Phone',
      'Location',
      'Route',
      'Process',
      'Address',
    ])

    // ── Booking rows ──────────────────────────────────────────────────────────
    bookings.forEach((b, i) => {
      rows.push([
        i + 1,
        b.name,
        b.staffNumber,
        b.phoneNumber,
        b.location,
        b.route,
        b.process,
        b.address,
      ])
    })

    rows.push([]) // spacer between shifts
    rows.push([]) // extra breathing room
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // ── Column widths ─────────────────────────────────────────────────────────
  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 22 },  // Name
    { wch: 12 },  // Staff No
    { wch: 14 },  // Phone
    { wch: 18 },  // Location
    { wch: 28 },  // Route
    { wch: 14 },  // Process
    { wch: 32 },  // Address
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
  XLSX.writeFile(wb, `transport-bookings-${date}.xlsx`)
}
