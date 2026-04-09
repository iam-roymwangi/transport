/**
 * Normalize various date formats to ISO string
 * Handles: Excel serial dates, DD/MM/YYYY, YYYY-MM-DD, Date objects
 */
function normalizeDate(dateValue) {
  if (!dateValue) return null;

  // Already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toISOString();
  }

  // Excel serial date (number)
  if (typeof dateValue === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
    return date.toISOString();
  }

  // String date
  if (typeof dateValue === "string") {
    // Try parsing DD/MM/YYYY
    if (dateValue.includes("/")) {
      const [day, month, year] = dateValue.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Try ISO format or other standard formats
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  throw new Error(`Invalid date format: ${dateValue}`);
}

module.exports = normalizeDate;
