const express = require("express");
const multer = require("multer");

const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const supabase = require("../supabase");

const router = express.Router();

// ====================================================
// MULTER CONFIGURATION
// ====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed"));
    }
  },

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// ====================================================
// GET MY WEBSITE
// GET /api/websites/my-website
// ====================================================

router.get("/my-website", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        w.id,
        b.name AS "businessName",
        b.phone,
        b.whatsapp,
        b.address,
        w.about,
        w.logo,
        w.theme,
        w.hours,
        w.hero_title AS "heroTitle",
        w.hero_subtitle AS "heroSubtitle",
        w.hero_badge AS "heroBadge"
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE b.user_id = $1
      LIMIT 1
      `,
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const website = result.rows[0];

    const servicesResult = await pool.query(
      `
      SELECT name
      FROM services
      WHERE website_id = $1
      ORDER BY id
      `,
      [website.id],
    );

    website.services = servicesResult.rows.map((service) => service.name);

    return res.json(website);
  } catch (error) {
    console.error("Get my website error:", error);

    return res.status(500).json({
      message: "Failed to load website",
      error: error.message,
    });
  }
});

// ====================================================
// UPLOAD LOGO TO SUPABASE
// POST /api/websites/upload-logo
// ====================================================

router.post(
  "/upload-logo",
  authMiddleware,
  upload.single("logo"),
  async (req, res) => {
    try {
      // ------------------------------------------------
      // CHECK FILE
      // ------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          message: "No logo file uploaded",
        });
      }

      console.log("======================================");
      console.log("Uploading logo to Supabase...");
      console.log("Original file:", req.file.originalname);
      console.log("MIME type:", req.file.mimetype);
      console.log("File size:", req.file.size);
      console.log("User ID:", req.user.userId);

      // ------------------------------------------------
      // GET USER'S WEBSITE
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

      console.log("Website ID:", websiteId);

      // ------------------------------------------------
      // DETERMINE FILE EXTENSION
      // ------------------------------------------------

      let extension = "png";

      if (req.file.mimetype === "image/jpeg") {
        extension = "jpg";
      } else if (req.file.mimetype === "image/png") {
        extension = "png";
      } else if (req.file.mimetype === "image/webp") {
        extension = "webp";
      } else if (req.file.mimetype === "image/gif") {
        extension = "gif";
      }

      // ------------------------------------------------
      // CREATE REAL FILE NAME
      // ------------------------------------------------

      const randomPart = Math.random().toString(36).substring(2, 10);

      const fileName =
        "website-" +
        websiteId +
        "-" +
        Date.now() +
        "-" +
        randomPart +
        "." +
        extension;

      console.log("Supabase file name:", fileName);

      // ------------------------------------------------
      // UPLOAD TO SUPABASE STORAGE
      // ------------------------------------------------

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("website-logos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);

        return res.status(500).json({
          message: "Failed to upload logo",
          error: uploadError.message,
        });
      }

      console.log("Supabase upload successful:", uploadData);

      // ------------------------------------------------
      // GET PUBLIC URL
      // ------------------------------------------------

      const { data: publicUrlData } = supabase.storage
        .from("website-logos")
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return res.status(500).json({
          message: "Failed to generate logo URL",
        });
      }

      const logoUrl = publicUrlData.publicUrl;

      console.log("Logo public URL:", logoUrl);

      // ------------------------------------------------
      // SAVE URL IN POSTGRESQL
      // ------------------------------------------------

      await pool.query(
        `
        UPDATE websites
        SET
          logo = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [logoUrl, websiteId],
      );

      console.log("Logo URL saved to PostgreSQL.");
      console.log("======================================");

      // ------------------------------------------------
      // RETURN RESULT
      // ------------------------------------------------

      return res.json({
        message: "Logo uploaded successfully",
        logo: logoUrl,
        websiteId: websiteId,
      });
    } catch (error) {
      console.error("Logo upload error:", error);

      return res.status(500).json({
        message: "Logo upload failed",
        error: error.message,
      });
    }
  },
);

// ====================================================
// DELETE LOGO
// DELETE /api/websites/logo
// ====================================================

router.delete("/logo", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        w.id,
        w.logo
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE b.user_id = $1
      LIMIT 1
      `,
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const website = result.rows[0];

    // ------------------------------------------------
    // DELETE FILE FROM SUPABASE
    // ------------------------------------------------

    if (website.logo) {
      try {
        const logoUrl = new URL(website.logo);

        const marker = "/website-logos/";

        const markerIndex = logoUrl.pathname.indexOf(marker);

        if (markerIndex !== -1) {
          const fileName = decodeURIComponent(
            logoUrl.pathname.substring(markerIndex + marker.length),
          );

          console.log("Deleting Supabase file:", fileName);

          const { error: deleteError } = await supabase.storage
            .from("website-logos")
            .remove([fileName]);

          if (deleteError) {
            console.error("Supabase delete error:", deleteError);
          }
        }
      } catch (error) {
        console.error("Error determining Supabase file:", error);
      }
    }

    // ------------------------------------------------
    // REMOVE URL FROM DATABASE
    // ------------------------------------------------

    await pool.query(
      `
      UPDATE websites
      SET
        logo = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [website.id],
    );

    return res.json({
      message: "Logo deleted successfully",
    });
  } catch (error) {
    console.error("Delete logo error:", error);

    return res.status(500).json({
      message: "Failed to delete logo",
      error: error.message,
    });
  }
});

// ====================================================
// GET PUBLIC WEBSITE
// GET /api/websites/public/:id
// ====================================================

router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const websiteResult = await pool.query(
      `
      SELECT
        w.id,
        b.name AS "businessName",
        b.phone,
        b.whatsapp,
        b.address,
        w.about,
        w.logo,
        w.theme,
        w.hours,
        w.hero_title AS "heroTitle",
        w.hero_subtitle AS "heroSubtitle",
        w.hero_badge AS "heroBadge"
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE w.id = $1
      `,
      [id],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const website = websiteResult.rows[0];

    const servicesResult = await pool.query(
      `
      SELECT name
      FROM services
      WHERE website_id = $1
      ORDER BY id
      `,
      [id],
    );

    website.services = servicesResult.rows.map((service) => service.name);

    return res.json(website);
  } catch (error) {
    console.error("Public website error:", error);

    return res.status(500).json({
      message: "Failed to load public website",
      error: error.message,
    });
  }
});

// ====================================================
// GET WEBSITE BY ID
// GET /api/websites/:id
// ====================================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const websiteResult = await pool.query(
      `
      SELECT
        w.id,
        b.name AS "businessName",
        b.phone,
        b.whatsapp,
        b.address,
        w.about,
        w.logo,
        w.theme,
        w.hours,
        w.hero_title AS "heroTitle",
        w.hero_subtitle AS "heroSubtitle",
        w.hero_badge AS "heroBadge"
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE w.id = $1
        AND b.user_id = $2
      `,
      [id, req.user.userId],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const website = websiteResult.rows[0];

    const servicesResult = await pool.query(
      `
      SELECT name
      FROM services
      WHERE website_id = $1
      ORDER BY id
      `,
      [id],
    );

    website.services = servicesResult.rows.map((service) => service.name);

    return res.json(website);
  } catch (error) {
    console.error("Get website error:", error);

    return res.status(500).json({
      message: "Failed to load website",
      error: error.message,
    });
  }
});

// ====================================================
// UPDATE MY WEBSITE
// PUT /api/websites/my-website
// ====================================================

router.put("/my-website", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      businessName,
      phone,
      about,
      theme,
      address,
      whatsapp,
      hours,
      services,
      heroTitle,
      heroSubtitle,
      heroBadge,
    } = req.body;

    await client.query("BEGIN");

    // ------------------------------------------------
    // FIND BUSINESS
    // ------------------------------------------------

    const businessResult = await client.query(
      `
      SELECT id
      FROM businesses
      WHERE user_id = $1
      LIMIT 1
      `,
      [req.user.userId],
    );

    if (businessResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Business not found",
      });
    }

    const businessId = businessResult.rows[0].id;

    // ------------------------------------------------
    // FIND WEBSITE
    // ------------------------------------------------

    const websiteResult = await client.query(
      `
      SELECT id
      FROM websites
      WHERE business_id = $1
      LIMIT 1
      `,
      [businessId],
    );

    if (websiteResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Website not found",
      });
    }

    const websiteId = websiteResult.rows[0].id;

    // ------------------------------------------------
    // UPDATE BUSINESS
    // ------------------------------------------------

    await client.query(
      `
      UPDATE businesses
      SET
        name = $1,
        phone = $2,
        whatsapp = $3,
        address = $4
      WHERE id = $5
      `,
      [businessName, phone, whatsapp, address, businessId],
    );

    // ------------------------------------------------
    // UPDATE WEBSITE
    // Logo is intentionally NOT updated here.
    // ------------------------------------------------

    await client.query(
      `
  UPDATE websites
  SET
    about = $1,
    theme = $2,
    hours = $3,
    hero_title = $4,
    hero_subtitle = $5,
    hero_badge = $6,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $7
  `,
      [about, theme, hours, heroTitle, heroSubtitle, heroBadge, websiteId],
    );

    // ------------------------------------------------
    // UPDATE SERVICES
    // ------------------------------------------------

    await client.query(
      `
      DELETE FROM services
      WHERE website_id = $1
      `,
      [websiteId],
    );

    if (Array.isArray(services)) {
      for (const service of services) {
        if (typeof service === "string" && service.trim()) {
          await client.query(
            `
            INSERT INTO services (website_id, name)
            VALUES ($1, $2)
            `,
            [websiteId, service.trim()],
          );
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Website saved successfully",
      websiteId: websiteId,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Save website error:", error);

    return res.status(500).json({
      message: "Failed to save website",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ====================================================
// UPDATE WEBSITE BY ID
// PUT /api/websites/:id
// ====================================================

router.put("/:id", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      businessName,
      phone,
      whatsapp,
      address,
      about,
      theme,
      hours,
      services,
      heroTitle,
      heroSubtitle,
      heroBadge,
    } = req.body;

    await client.query("BEGIN");

    // ------------------------------------------------
    // VERIFY WEBSITE OWNERSHIP
    // ------------------------------------------------

    const websiteResult = await client.query(
      `
      SELECT
        w.id,
        w.business_id
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE w.id = $1
        AND b.user_id = $2
      `,
      [id, req.user.userId],
    );

    if (websiteResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Website not found",
      });
    }

    const businessId = websiteResult.rows[0].business_id;

    // ------------------------------------------------
    // UPDATE BUSINESS
    // ------------------------------------------------

    await client.query(
      `
      UPDATE businesses
      SET
        name = $1,
        phone = $2,
        whatsapp = $3,
        address = $4
      WHERE id = $5
      `,
      [businessName, phone, whatsapp, address, businessId],
    );

    // ------------------------------------------------
    // UPDATE WEBSITE
    // Logo is intentionally NOT updated here.
    // ------------------------------------------------

    await client.query(
      `
     UPDATE websites
SET
  about = $1,
  theme = $2,
  hours = $3,
  hero_title = $4,
  hero_subtitle = $5,
  hero_badge = $6,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $7
      `,
      [about, theme, hours, heroTitle, heroSubtitle, heroBadge, id],
    );

    // ------------------------------------------------
    // UPDATE SERVICES
    // ------------------------------------------------

    await client.query(
      `
      DELETE FROM services
      WHERE website_id = $1
      `,
      [id],
    );

    if (Array.isArray(services)) {
      for (const service of services) {
        if (typeof service === "string" && service.trim()) {
          await client.query(
            `
            INSERT INTO services (website_id, name)
            VALUES ($1, $2)
            `,
            [id, service.trim()],
          );
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Website updated successfully",
      websiteId: Number(id),
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update website error:", error);

    return res.status(500).json({
      message: "Failed to update website",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ====================================================
// EXPORT ROUTER
// ====================================================

module.exports = router;
