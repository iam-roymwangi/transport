/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Duplicate booking: You already booked this shift on this date.",
      error: "DUPLICATE_BOOKING",
    });
  }

  // Prisma validation errors
  if (err.code?.startsWith("P")) {
    return res.status(400).json({
      success: false,
      message: "Database validation error",
      error: err.message,
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
