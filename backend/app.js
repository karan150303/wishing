require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const analyticsRoutes = require("./routes/analyticsRoutes");
const giftRoutes = require("./routes/giftRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

// DB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔥 SERVE FRONTEND STATIC FILES
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// API routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/gift", giftRoutes);
// 🎯 Frontend entry (root)
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
