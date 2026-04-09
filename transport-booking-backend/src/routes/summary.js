const express = require("express");
const router = express.Router();
const { getSummary } = require("../controllers/bookingController");

router.get("/", getSummary);

module.exports = router;
