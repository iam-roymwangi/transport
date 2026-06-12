const {
  createBooking,
  getBookingsByDate,
  getSummaryByDate,
  getMyBookings,
  updateBooking,
  deleteBookings,
} = require("../services/bookingService");
const { getSystemSettings } = require("./settingsController");

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
    // Check if bookings are open
    const settings = await getSystemSettings();
    if (!settings.bookingsOpen) {
      return res.status(403).json({
        success: false,
        message: "Bookings are currently closed by the administrator.",
      });
    }

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

async function getStaffBookings(req, res, next) {
  const { staffNumber } = req.query;

  if (!staffNumber) {
    return res.status(400).json({
      success: false,
      message: "Query param 'staffNumber' is required",
    });
  }

  try {
    const bookings = await getMyBookings(staffNumber);
    return res.json({ success: true, bookings });
  } catch (err) {
    next(err);
  }
}

async function putBooking(req, res, next) {
  const { id } = req.params;

  try {
    const booking = await updateBooking(id, req.body);
    return res.json({ success: true, booking });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Update failed: A booking for this employee, date, and shift already exists.",
      });
    }
    next(err);
  }
}

async function deleteBookingsHandler(req, res, next) {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Body param 'ids' (non-empty array) is required",
    });
  }

  try {
    const result = await deleteBookings(ids);
    return res.json({ success: true, count: result.count });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postBooking,
  getBookings,
  getSummary,
  getStaffBookings,
  putBooking,
  deleteBookingsHandler,
};
