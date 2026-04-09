/**
 * Trim and normalize string input
 * Returns null for empty/undefined values
 */
function cleanString(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned.length > 0 ? cleaned : null;
}

module.exports = cleanString;
