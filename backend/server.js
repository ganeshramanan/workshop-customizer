require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./db");

const app = express();

// Use Render's PORT in production, 5000 locally
const PORT = process.env.PORT || 5000;

// ====================================================
// ROUTES
// ====================================================

const websiteRoutes = require("./routes/websiteRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const serviceRequestRoutes = require("./routes/serviceRequestRoutes");

// ====================================================
// MIDDLEWARE
// ====================================================

// Keep CORS simple for now.
// This allows both local development and the Vercel frontend.
app.use(cors());

app.use(express.json());

// ====================================================
// STATIC UPLOADS
// ====================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====================================================
// API ROUTES
// ====================================================

app.use("/api/websites", websiteRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/service-requests", serviceRequestRoutes);

// ====================================================
// ROOT
// ====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Workshop Customizer API is running",
  });
});

// ====================================================
// HEALTH CHECK
// ====================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is healthy",
  });
});

// ====================================================
// DATABASE TEST
// ====================================================

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      message: "PostgreSQL connection successful",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ====================================================
// START SERVER
// ====================================================

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
