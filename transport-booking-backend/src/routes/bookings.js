const express = require("express");
const router = express.Router();
const { postBooking, getBookings, getSummary } = require("../controllers/bookingController");

router.post("/", postBooking);
router.get("/", getBookings);

module.exports = router;
