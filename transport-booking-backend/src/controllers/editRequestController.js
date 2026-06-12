const prisma = require("../config/db");
const { getSystemSettings } = require("./settingsController");
const normalizeDate = require("../utils/normalizeDate");

async function getEditRequests(req, res, next) {
  try {
    const requests = await prisma.bookingEditRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const bookingIds = requests.map((r) => r.bookingId);
    const originalBookings = await prisma.booking.findMany({
      where: { id: { in: bookingIds } },
    });

    const bookingsMap = {};
    originalBookings.forEach((b) => {
      bookingsMap[b.id] = b;
    });

    const requestsWithContext = requests.map((req) => ({
      ...req,
      originalBooking: bookingsMap[req.bookingId] || null,
    }));

    return res.json({ success: true, requests: requestsWithContext });
  } catch (err) {
    next(err);
  }
}


async function postEditRequest(req, res, next) {
  const { bookingId, staffNumber, requestedChanges } = req.body;

  if (!bookingId || !staffNumber || !requestedChanges) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: bookingId, staffNumber, requestedChanges",
    });
  }

  try {
    const settings = await getSystemSettings();
    if (!settings.bookingsOpen) {
      return res.status(403).json({
        success: false,
        message: "Bookings are currently closed by the administrator.",
      });
    }

    // Format date in requestedChanges if provided
    let parsedChanges = { ...requestedChanges };
    if (parsedChanges.date) {
      parsedChanges.date = new Date(normalizeDate(parsedChanges.date)).toISOString();
    }

    const request = await prisma.bookingEditRequest.create({
      data: {
        bookingId,
        staffNumber: staffNumber.toUpperCase(),
        requestedChanges: parsedChanges,
        status: "PENDING",
      },
    });

    return res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
}

async function approveEditRequest(req, res, next) {
  const { id } = req.params;

  try {
    const request = await prisma.bookingEditRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Edit request not found",
      });
    }

    // Apply requested changes to the Booking
    // Let's ensure the date is parsed correctly if present
    const changes = request.requestedChanges;
    if (changes.date) {
      changes.date = new Date(changes.date);
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: request.bookingId },
        data: changes,
      }),
      prisma.bookingEditRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
    ]);

    return res.json({ success: true, message: "Request approved and changes applied." });
  } catch (err) {
    // Check for Prisma unique constraint on the booking update
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Approval failed: Applying these changes would create a duplicate booking.",
      });
    }
    next(err);
  }
}

async function rejectEditRequest(req, res, next) {
  const { id } = req.params;

  try {
    const updated = await prisma.bookingEditRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return res.json({ success: true, request: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEditRequests, postEditRequest, approveEditRequest, rejectEditRequest };
