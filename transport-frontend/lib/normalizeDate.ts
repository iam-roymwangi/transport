/**
 * Normalize various date formats to a JS Date object.
 * Handles: Excel serial numbers, DD/MM/YYYY strings, ISO strings, Date objects.
 */
export function normalizeDate(dateValue: unknown): Date {
  if (!dateValue) throw new Error('Date value is required')

  if (dateValue instanceof Date) return dateValue

  // Excel serial date (number)
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    return new Date(excelEpoch.getTime() + dateValue * 86_400_000)
  }

  if (typeof dateValue === 'string') {
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      const [day, month, year] = dateValue.split('/')
      return new Date(`${year}-${month}-${day}`)
    }
    const d = new Date(dateValue)
    if (!isNaN(d.getTime())) return d
  }

  throw new Error(`Invalid date format: ${dateValue}`)
}
