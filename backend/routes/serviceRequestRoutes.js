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
// UPDATE SERVICE REQUEST STATUS
// PATCH /api/service-requests/:id/status
// ====================================================

router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ------------------------------------------------
    // VALIDATE STATUS
    // ------------------------------------------------

    const allowedStatuses = ["new", "contacted", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // ------------------------------------------------
    // VERIFY OWNERSHIP + UPDATE
    // ------------------------------------------------

    const result = await pool.query(
      `
      UPDATE service_requests sr
      SET status = $1
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE sr.id = $2
        AND sr.website_id = w.id
        AND b.user_id = $3
      RETURNING
        sr.id,
        sr.website_id,
        sr.customer_name,
        sr.phone,
        sr.vehicle,
        sr.service,
        sr.preferred_date,
        sr.message,
        sr.status,
        sr.created_at
      `,
      [status, id, req.user.userId],
    );

    // ------------------------------------------------
    // REQUEST NOT FOUND
    // ------------------------------------------------

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Service request not found",
      });
    }

    // ------------------------------------------------
    // SUCCESS
    // ------------------------------------------------

    return res.json({
      message: "Enquiry status updated successfully",
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      message: "Failed to update enquiry status",
      error: error.message,
    });
  }
});

// ====================================================
// GET MY SERVICE REQUESTS
// GET /api/service-requests/my-requests
//
// Optional query parameters:
// ?status=new
// ?status=contacted
// ?status=completed
// ?limit=10
// ?offset=0
// ====================================================

router.get("/my-requests", authMiddleware, async (req, res) => {
  try {
    const requestedStatus = String(req.query.status || "all").toLowerCase();

    const allowedStatuses = ["all", "new", "contacted", "completed"];

    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        message: "Invalid status filter",
      });
    }

    // ------------------------------------------------
    // LIMIT / OFFSET
    // ------------------------------------------------

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

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
    // GET TOTAL COUNTS
    // ------------------------------------------------

    const countResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status = 'new'
        )::int AS new_count,
        COUNT(*) FILTER (
          WHERE status = 'contacted'
        )::int AS contacted_count,
        COUNT(*) FILTER (
          WHERE status = 'completed'
        )::int AS completed_count
      FROM service_requests
      WHERE website_id = $1
      `,
      [websiteId],
    );

    const counts = countResult.rows[0];

    // ------------------------------------------------
    // BUILD FILTER
    // ------------------------------------------------

    const queryParams = [websiteId];
    let statusCondition = "";

    if (requestedStatus !== "all") {
      queryParams.push(requestedStatus);
      statusCondition = `AND status = $${queryParams.length}`;
    }

    // LIMIT
    queryParams.push(limit);
    const limitPosition = queryParams.length;

    // OFFSET
    queryParams.push(offset);
    const offsetPosition = queryParams.length;

    // ------------------------------------------------
    // GET ENQUIRIES
    // ------------------------------------------------

    const result = await pool.query(
      `
      SELECT
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
      FROM service_requests
      WHERE website_id = $1
      ${statusCondition}
      ORDER BY created_at DESC
      LIMIT $${limitPosition}
      OFFSET $${offsetPosition}
      `,
      queryParams,
    );

    // ------------------------------------------------
    // RETURN
    // ------------------------------------------------

    return res.json({
      enquiries: result.rows,

      counts: {
        total: counts.total,
        new: counts.new_count,
        contacted: counts.contacted_count,
        completed: counts.completed_count,
      },

      pagination: {
        limit,
        offset,
        returned: result.rows.length,
        hasMore: result.rows.length === limit,
      },
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
