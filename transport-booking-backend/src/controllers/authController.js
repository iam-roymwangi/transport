const prisma = require("../config/db");

async function login(req, res, next) {
  const { staffNumber } = req.body;

  if (!staffNumber) {
    return res.status(400).json({
      success: false,
      message: "Staff Number is required",
    });
  }

  try {
    const staff = await prisma.staff.findUnique({
      where: { staffNumber: staffNumber.toUpperCase() },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Invalid Staff Number. Employee not found.",
      });
    }

    return res.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        staffNumber: staff.staffNumber,
        phoneNumber: staff.phoneNumber,
        location: staff.location,
        currentShift: staff.currentShift,
        process: staff.process,
        route: staff.route,
        address: staff.address,
        pinLocation: staff.pinLocation,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function adminLogin(req, res, next) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  const correctPassword = process.env.ADMIN_PASSWORD || "secretadmin";

  if (password === correctPassword) {
    return res.json({
      success: true,
      token: "authenticated_admin_token", // Simple mock token for authorization
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid password",
  });
}

module.exports = { login, adminLogin };
