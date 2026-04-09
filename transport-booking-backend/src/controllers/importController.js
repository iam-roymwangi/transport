const xlsx = require("xlsx");
const { createBooking } = require("../services/bookingService");
const cleanString = require("../utils/cleanString");

// Microsoft Forms field → model field mapping
const FIELD_MAP = {
  "Name": "name",
  "Staff Number": "staffNumber",
  "Phone Number": "phoneNumber",
  "Location": "location",
  "Route": "route",
  "Pickup/Dropoff time": "shift",
  "Pickup/Dropoff date": "date",
  "Address": "address",
  "Process": "process",
};

function mapRow(row) {
  const mapped = {};
  for (const [formField, modelField] of Object.entries(FIELD_MAP)) {
    mapped[modelField] = row[formField] ?? null;
  }
  return mapped;
}

async function importBookings(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let inserted = 0;
    const duplicates = [];

    for (const row of rows) {
      const data = mapRow(row);

      // Skip rows missing required fields
      if (!cleanString(data.name) || !cleanString(data.staffNumber) || !cleanString(data.shift) || !data.date) {
        console.warn("Skipping incomplete row:", row);
        continue;
      }

      try {
        await createBooking(data);
        inserted++;
      } catch (err) {
        if (err.code === "P2002") {
          // Duplicate — log and continue
          console.log(`Duplicate skipped: ${data.staffNumber} on ${data.date} shift ${data.shift}`);
          duplicates.push({
            staffNumber: cleanString(data.staffNumber),
            date: data.date,
            shift: cleanString(data.shift),
            name: cleanString(data.name),
          });
        } else {
          // Unexpected error — rethrow
          throw err;
        }
      }
    }

    return res.json({
      success: true,
      inserted,
      duplicates,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { importBookings };
