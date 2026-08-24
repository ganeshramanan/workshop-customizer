const express = require("express");

const pool = require("../db");

const router = express.Router();

// ====================================================
// ALLOWED ANALYTICS EVENTS
// ====================================================

const ALLOWED_EVENTS = [
  "page_view",
  "whatsapp_click",
  "phone_click",
  "direction_click",
];

// ====================================================
// RECORD ANALYTICS EVENT
// POST /api/analytics/event
// ====================================================

router.post("/event", async (req, res) => {
  try {
    const { websiteId, eventType } = req.body;

    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (!websiteId) {
      return res.status(400).json({
        message: "Website ID is required",
      });
    }

    if (!ALLOWED_EVENTS.includes(eventType)) {
      return res.status(400).json({
        message: "Invalid analytics event",
      });
    }

    // ------------------------------------------------
    // CHECK WEBSITE EXISTS
    // ------------------------------------------------

    const websiteResult = await pool.query(
      `
      SELECT id
      FROM websites
      WHERE id = $1
      LIMIT 1
      `,
      [websiteId],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    // ------------------------------------------------
    // RECORD EVENT
    // ------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO website_analytics (
        website_id,
        event_type
      )
      VALUES ($1, $2)
      RETURNING
        id,
        website_id,
        event_type,
        created_at
      `,
      [websiteId, eventType],
    );

    // ------------------------------------------------
    // SUCCESS
    // ------------------------------------------------

    return res.status(201).json({
      message: "Analytics event recorded",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("=================================");
    console.error("ANALYTICS EVENT ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("=================================");

    return res.status(500).json({
      message: "Failed to record analytics event",
      error: error.message,
    });
  }
});

// ====================================================
// GET ANALYTICS SUMMARY
// GET /api/analytics/summary/:websiteId
// ====================================================

router.get("/summary/:websiteId", async (req, res) => {
  try {
    const { websiteId } = req.params;

    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (!websiteId) {
      return res.status(400).json({
        message: "Website ID is required",
      });
    }

    // ------------------------------------------------
    // CHECK WEBSITE EXISTS
    // ------------------------------------------------

    const websiteResult = await pool.query(
      `
      SELECT id
      FROM websites
      WHERE id = $1
      LIMIT 1
      `,
      [websiteId],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    // ------------------------------------------------
    // CALCULATE ANALYTICS
    // ------------------------------------------------

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE event_type = 'page_view'
        ) AS page_views,

        COUNT(*) FILTER (
          WHERE event_type = 'whatsapp_click'
        ) AS whatsapp_clicks,

        COUNT(*) FILTER (
          WHERE event_type = 'phone_click'
        ) AS phone_clicks,

        COUNT(*) FILTER (
          WHERE event_type = 'direction_click'
        ) AS direction_clicks,

        COUNT(*) AS total_events

      FROM website_analytics
      WHERE website_id = $1
      `,
      [websiteId],
    );

    const analytics = result.rows[0];

    return res.status(200).json({
      websiteId: Number(websiteId),

      pageViews: Number(analytics.page_views || 0),

      whatsappClicks: Number(analytics.whatsapp_clicks || 0),

      phoneClicks: Number(analytics.phone_clicks || 0),

      directionClicks: Number(analytics.direction_clicks || 0),

      totalEvents: Number(analytics.total_events || 0),
    });
  } catch (error) {
    console.error("=================================");
    console.error("ANALYTICS SUMMARY ERROR");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Detail:", error.detail);
    console.error("Hint:", error.hint);
    console.error("=================================");

    return res.status(500).json({
      message: "Failed to load analytics summary",
      error: error.message,
    });
  }
});

// ====================================================
// EXPORT ROUTER
// ====================================================

module.exports = router;
