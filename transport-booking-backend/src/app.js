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

const app = express();

// Middleware
// Configure CORS - Allow all origins during development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: false
}));

// Explicitly handle preflight requests
app.options('*', cors());

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
