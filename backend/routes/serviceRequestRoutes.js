const express = require("express");

const router = express.Router();

const pool = require("../db");

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
        customer_name,
        phone,
        vehicle,
        service,
        preferred_date,
        message,
        status,
        created_at
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

    // ====================================================
    // SUCCESS
    // ====================================================

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

module.exports = router;
