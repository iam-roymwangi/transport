require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./utils/errorHandler");

const bookingsRouter = require("./routes/bookings");
const importRouter = require("./routes/import");
const summaryRouter = require("./routes/summary");
const authRouter = require("./routes/auth");
const settingsRouter = require("./routes/settings");
const editRequestsRouter = require("./routes/editRequests");

const app = express();

// Middleware
// Configure CORS - Dynamically allow request origins to resolve CORS issues with Expo Go / Web
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins dynamically (including localhost, Expo web ports, and local IP addresses)
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/bookings", bookingsRouter);
app.use("/import-bookings", importRouter);
app.use("/summary", summaryRouter);
app.use("/auth", authRouter);
app.use("/settings", settingsRouter);
app.use("/edit-requests", editRequestsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
