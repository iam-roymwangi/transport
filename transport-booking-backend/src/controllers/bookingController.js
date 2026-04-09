const {
  createBooking,
  getBookingsByDate,
  getSummaryByDate,
} = require("../services/bookingService");

async function postBooking(req, res, next) {
  const { name, staffNumber, shift, date } = req.body;

  // Validate required fields
  if (!name || !staffNumber || !shift || !date) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: name, staffNumber, shift, date",
    });
  }

  try {
    const booking = await createBooking(req.body);
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    // Prisma unique constraint
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate booking: You already booked this shift on this date.",
        error: "DUPLICATE_BOOKING",
      });
    }
    next(err);
  }
}

async function getBookings(req, res, next) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Query param 'date' is required (YYYY-MM-DD)",
    });
  }

  try {
    const result = await getBookingsByDate(date);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "Query param 'date' is required (YYYY-MM-DD)",
    });
  }

  try {
    const result = await getSummaryByDate(date);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { postBooking, getBookings, getSummary };
