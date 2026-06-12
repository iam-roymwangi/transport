const express = require("express");
const router = express.Router();
const {
  postBooking,
  getBookings,
  getStaffBookings,
  putBooking,
  deleteBookingsHandler,
} = require("../controllers/bookingController");

router.post("/", postBooking);
router.get("/", getBookings);
router.get("/my", getStaffBookings);
router.put("/:id", putBooking);
router.delete("/", deleteBookingsHandler);

module.exports = router;
