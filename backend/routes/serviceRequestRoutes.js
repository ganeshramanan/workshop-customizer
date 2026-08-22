const express = require("express");

const router = express.Router();

const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// ====================================================
// CREATE SERVICE REQUEST
// POST /api/service-requests
// ====================================================

router.post("/", async (req, res) => {
  try {
    const {
      websiteId,
      customerName,
      phone,
      vehicle,
      service,
      preferredDate,
      message,
    } = req.body;

    console.log("=================================");
    console.log("New service request received");
    console.log("Website ID:", websiteId);
    console.log("Customer:", customerName);
    console.log("Phone:", phone);
    console.log("Vehicle:", vehicle);
    console.log("Service:", service);
    console.log("Preferred Date:", preferredDate);
    console.log("=================================");

    // ====================================================
    // VALIDATION
    // ====================================================

    if (!websiteId) {
      return res.status(400).json({
        message: "Website ID is required",
      });
    }

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    // ====================================================
    // CHECK WEBSITE EXISTS
    // ====================================================

    const websiteResult = await pool.query(
      `
      SELECT id
      FROM websites
      WHERE id = $1
      `,
      [websiteId],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    // ====================================================
    // INSERT SERVICE REQUEST
    // ====================================================

    const result = await pool.query(
      `
      INSERT INTO service_requests (
        website_id,
        customer_name,
        phone,
        vehicle,
        service,
        preferred_date,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        website_id,
        customer_name AS "customerName",
        phone,
        vehicle,
        service,
        preferred_date AS "preferredDate",
        message,
        status,
        created_at AS "createdAt"
      `,
      [
        websiteId,
        customerName.trim(),
        phone.trim(),
        vehicle || null,
        service || null,
        preferredDate || null,
        message || null,
      ],
    );

    console.log("Service request created:", result.rows[0]);

    return res.status(201).json({
      message: "Service request submitted successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("=================================");
    console.error("CREATE SERVICE REQUEST ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("=================================");

    return res.status(500).json({
      message: "Failed to create service request",
      error: error.message,
    });
  }
});

// ====================================================
// GET MY SERVICE REQUESTS
// GET /api/service-requests/my-requests
// ====================================================

router.get("/my-requests", authMiddleware, async (req, res) => {
  try {
    console.log("=================================");
    console.log("Loading customer enquiries");
    console.log("Authenticated user:", req.user);
    console.log("=================================");

    // ------------------------------------------------
    // FIND USER'S WEBSITE
    // ------------------------------------------------

    const websiteResult = await pool.query(
      `
      SELECT w.id
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE b.user_id = $1
      LIMIT 1
      `,
      [req.user.userId],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const websiteId = websiteResult.rows[0].id;

    // ------------------------------------------------
    // GET ENQUIRIES
    // ------------------------------------------------

    const result = await pool.query(
      `
      SELECT
        id,
        website_id AS "websiteId",
        customer_name AS "customerName",
        phone,
        vehicle,
        service,
        preferred_date AS "preferredDate",
        message,
        status,
        created_at AS "createdAt"
      FROM service_requests
      WHERE website_id = $1
      ORDER BY created_at DESC
      `,
      [websiteId],
    );

    return res.json({
      enquiries: result.rows,
    });
  } catch (error) {
    console.error("Get service requests error:", error);

    return res.status(500).json({
      message: "Failed to load enquiries",
      error: error.message,
    });
  }
});

module.exports = router;
