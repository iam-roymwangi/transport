require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./utils/errorHandler");

const bookingsRouter = require("./routes/bookings");
const importRouter = require("./routes/import");
const summaryRouter = require("./routes/summary");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/bookings", bookingsRouter);
app.use("/import-bookings", importRouter);
app.use("/summary", summaryRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
