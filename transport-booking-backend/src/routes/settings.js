const express = require("express");
const router = express.Router();
const { getSettings, toggleBookingsOpen, saveAutomationRules } = require("../controllers/settingsController");

router.get("/", getSettings);
router.post("/toggle", toggleBookingsOpen);
router.post("/automation", saveAutomationRules);

module.exports = router;
