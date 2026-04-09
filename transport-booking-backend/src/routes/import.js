const express = require("express");
const router = express.Router();
const multer = require("multer");
const { importBookings } = require("../controllers/importController");

// Store file in memory (no disk writes needed)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), importBookings);

module.exports = router;
