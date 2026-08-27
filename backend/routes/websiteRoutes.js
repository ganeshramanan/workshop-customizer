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
// HELPER
// CREATE URL-FRIENDLY SLUG
// ====================================================

const createSlug = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 160);
};

// ====================================================
// HELPER
// CHECK WHETHER SLUG IS A TEMPORARY WEBSITE-ID SLUG
// ====================================================

const isTemporarySlug = (slug, websiteId) => {
  return String(slug || "") === `website-${websiteId}`;
};

// ====================================================
// HELPER
// GET USER'S WEBSITE ID
// ====================================================

const getUserWebsiteId = async (userId) => {
  const result = await pool.query(
    `
      SELECT w.id
      FROM websites w
      JOIN businesses b
        ON w.business_id = b.id
      WHERE b.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].id;
};

// ====================================================
// HELPER
// GET USER'S WEBSITE
// ====================================================

const getUserWebsite = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        w.id,
        w.site_name AS "siteName",
        w.site_slug AS "siteSlug",
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
    [userId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const website = result.rows[0];

  // ------------------------------------------------
  // SERVICES
  // ------------------------------------------------

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

  // ------------------------------------------------
  // GALLERY
  // ------------------------------------------------

  const galleryResult = await pool.query(
    `
      SELECT
        id,
        image_url AS "imageUrl",
        file_name AS "fileName",
        created_at AS "createdAt"
      FROM website_gallery
      WHERE website_id = $1
      ORDER BY id
    `,
    [website.id],
  );

  website.gallery = galleryResult.rows;

  return website;
};

// ====================================================
// GET MY WEBSITE
// GET /api/websites/my-website
// ====================================================

router.get("/my-website", authMiddleware, async (req, res) => {
  try {
    let website = await getUserWebsite(req.user.userId);

    if (!website) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    // ------------------------------------------------
    // SLUG LOGIC
    //
    // A website-ID slug such as website-123 is only
    // a temporary placeholder.
    //
    // If the customer later provides a real business
    // or site name, replace the temporary slug with
    // the real slug.
    //
    // Once a real slug exists, NEVER regenerate it.
    // ------------------------------------------------

    if (!website.siteSlug || isTemporarySlug(website.siteSlug, website.id)) {
      const siteName =
        website.siteName?.trim() ||
        website.businessName?.trim() ||
        "My Website";

      let finalSlug = createSlug(siteName);

      if (!finalSlug) {
        finalSlug = `website-${website.id}`;
      }

      const hasRealName =
        Boolean(website.siteName?.trim()) ||
        Boolean(website.businessName?.trim());

      if (hasRealName) {
        // ------------------------------------------------
        // CHECK SLUG UNIQUENESS
        // ------------------------------------------------

        const existingSlug = await pool.query(
          `
            SELECT id
            FROM websites
            WHERE site_slug = $1
              AND id <> $2
            LIMIT 1
          `,
          [finalSlug, website.id],
        );

        if (existingSlug.rows.length > 0) {
          finalSlug = `${finalSlug}-${website.id}`;
        }

        await pool.query(
          `
            UPDATE websites
            SET
              site_name = COALESCE(NULLIF(site_name, ''), $1),
              site_slug = $2,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `,
          [siteName, finalSlug, website.id],
        );

        website.siteSlug = finalSlug;

        if (!website.siteName) {
          website.siteName = siteName;
        }
      }
    }

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
// UPLOAD LOGO
// POST /api/websites/upload-logo
// ====================================================

router.post(
  "/upload-logo",
  authMiddleware,
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No logo file uploaded",
        });
      }

      const websiteId = await getUserWebsiteId(req.user.userId);

      if (!websiteId) {
        return res.status(404).json({
          message: "Website not found",
        });
      }

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

      const { data: publicUrlData } = supabase.storage
        .from("website-logos")
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        return res.status(500).json({
          message: "Failed to generate logo URL",
        });
      }

      const logoUrl = publicUrlData.publicUrl;

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

      console.log("Logo uploaded successfully:", uploadData);

      return res.json({
        message: "Logo uploaded successfully",
        logo: logoUrl,
        websiteId,
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

    if (website.logo) {
      try {
        const logoUrl = new URL(website.logo);

        const marker = "/website-logos/";

        const markerIndex = logoUrl.pathname.indexOf(marker);

        if (markerIndex !== -1) {
          const fileName = decodeURIComponent(
            logoUrl.pathname.substring(markerIndex + marker.length),
          );

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
// UPLOAD GALLERY
// POST /api/websites/upload-gallery
// ====================================================

router.post(
  "/upload-gallery",
  authMiddleware,
  upload.array("gallery", 20),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No gallery images uploaded",
        });
      }

      const websiteId = await getUserWebsiteId(req.user.userId);

      if (!websiteId) {
        return res.status(404).json({
          message: "Website not found",
        });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        let extension = "png";

        if (file.mimetype === "image/jpeg") {
          extension = "jpg";
        } else if (file.mimetype === "image/png") {
          extension = "png";
        } else if (file.mimetype === "image/webp") {
          extension = "webp";
        } else if (file.mimetype === "image/gif") {
          extension = "gif";
        }

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

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("website-gallery")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Gallery upload error:", uploadError);

          return res.status(500).json({
            message: "Failed to upload gallery image",
            error: uploadError.message,
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("website-gallery")
          .getPublicUrl(fileName);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          return res.status(500).json({
            message: "Failed to generate gallery image URL",
          });
        }

        const imageUrl = publicUrlData.publicUrl;

        const galleryResult = await pool.query(
          `
            INSERT INTO website_gallery (
              website_id,
              image_url,
              file_name
            )
            VALUES ($1, $2, $3)
            RETURNING
              id,
              image_url AS "imageUrl",
              file_name AS "fileName",
              created_at AS "createdAt"
          `,
          [websiteId, imageUrl, fileName],
        );

        uploadedImages.push(galleryResult.rows[0]);
      }

      return res.status(201).json({
        message: "Gallery images uploaded successfully",
        images: uploadedImages,
        websiteId,
      });
    } catch (error) {
      console.error("Gallery upload error:", error);

      return res.status(500).json({
        message: "Gallery upload failed",
        error: error.message,
      });
    }
  },
);

// ====================================================
// DELETE GALLERY IMAGE
// DELETE /api/websites/gallery/:id
// ====================================================

router.delete("/gallery/:id", authMiddleware, async (req, res) => {
  try {
    const galleryId = req.params.id;

    const result = await pool.query(
      `
        SELECT
          wg.id,
          wg.website_id,
          wg.image_url,
          wg.file_name
        FROM website_gallery wg
        JOIN websites w
          ON wg.website_id = w.id
        JOIN businesses b
          ON w.business_id = b.id
        WHERE wg.id = $1
          AND b.user_id = $2
      `,
      [galleryId, req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Gallery image not found",
      });
    }

    const image = result.rows[0];

    if (image.file_name) {
      const { error: deleteError } = await supabase.storage
        .from("website-gallery")
        .remove([image.file_name]);

      if (deleteError) {
        console.error("Supabase gallery delete error:", deleteError);
      }
    }

    await pool.query(
      `
        DELETE FROM website_gallery
        WHERE id = $1
      `,
      [galleryId],
    );

    return res.json({
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Delete gallery image error:", error);

    return res.status(500).json({
      message: "Failed to delete gallery image",
      error: error.message,
    });
  }
});

// ====================================================
// GET PUBLIC WEBSITE BY SLUG
// GET /api/websites/public/:slug
// ====================================================

router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const websiteResult = await pool.query(
      `
        SELECT
          w.id,
          w.site_name AS "siteName",
          w.site_slug AS "siteSlug",
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
        WHERE w.site_slug = $1
        LIMIT 1
      `,
      [slug],
    );

    if (websiteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Website not found",
      });
    }

    const website = websiteResult.rows[0];

    // ------------------------------------------------
    // SERVICES
    // ------------------------------------------------

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

    // ------------------------------------------------
    // GALLERY
    // ------------------------------------------------

    const galleryResult = await pool.query(
      `
        SELECT
          id,
          image_url AS "imageUrl",
          file_name AS "fileName",
          created_at AS "createdAt"
        FROM website_gallery
        WHERE website_id = $1
        ORDER BY id
      `,
      [website.id],
    );

    website.gallery = galleryResult.rows;

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
// LEGACY PUBLIC WEBSITE BY NUMERIC ID
// GET /api/websites/public-id/:id
//
// Kept temporarily so existing links don't break.
// ====================================================

router.get("/public-id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const websiteResult = await pool.query(
      `
        SELECT
          w.id,
          w.site_name AS "siteName",
          w.site_slug AS "siteSlug",
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
        LIMIT 1
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

    const galleryResult = await pool.query(
      `
        SELECT
          id,
          image_url AS "imageUrl",
          file_name AS "fileName",
          created_at AS "createdAt"
        FROM website_gallery
        WHERE website_id = $1
        ORDER BY id
      `,
      [id],
    );

    website.gallery = galleryResult.rows;

    return res.json(website);
  } catch (error) {
    console.error("Legacy public website error:", error);

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
          w.site_name AS "siteName",
          w.site_slug AS "siteSlug",
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

    const galleryResult = await pool.query(
      `
        SELECT
          id,
          image_url AS "imageUrl",
          file_name AS "fileName",
          created_at AS "createdAt"
        FROM website_gallery
        WHERE website_id = $1
        ORDER BY id
      `,
      [id],
    );

    website.gallery = galleryResult.rows;

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
      siteName,
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
        SELECT
          id,
          site_name,
          site_slug
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

    const existingSiteName = websiteResult.rows[0].site_name;
    const existingSiteSlug = websiteResult.rows[0].site_slug;

    // ------------------------------------------------
    // SITE NAME
    //
    // Site name can change.
    // ------------------------------------------------

    const finalSiteName = String(
      siteName?.trim() ||
        businessName?.trim() ||
        existingSiteName?.trim() ||
        "My Website",
    ).trim();

    // ------------------------------------------------
    // SITE SLUG
    //
    // Existing REAL slug is permanent.
    //
    // A temporary website-ID slug can be replaced
    // once the customer provides a real name.
    // ------------------------------------------------

    const temporarySlug = `website-${websiteId}`;

    let finalSlug = existingSiteSlug;

    if (!finalSlug || isTemporarySlug(finalSlug, websiteId)) {
      finalSlug = createSlug(finalSiteName);

      if (!finalSlug) {
        finalSlug = temporarySlug;
      }

      // Only check uniqueness when creating a
      // real slug.
      if (finalSlug !== temporarySlug) {
        const existingSlug = await client.query(
          `
            SELECT id
            FROM websites
            WHERE site_slug = $1
              AND id <> $2
            LIMIT 1
          `,
          [finalSlug, websiteId],
        );

        if (existingSlug.rows.length > 0) {
          finalSlug = `${finalSlug}-${websiteId}`;
        }
      }
    }

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
      [businessName || finalSiteName, phone, whatsapp, address, businessId],
    );

    // ------------------------------------------------
    // UPDATE WEBSITE
    // ------------------------------------------------

    await client.query(
      `
        UPDATE websites
        SET
          site_name = $1,
          site_slug = $2,
          about = $3,
          theme = $4,
          hours = $5,
          hero_title = $6,
          hero_subtitle = $7,
          hero_badge = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `,
      [
        finalSiteName,
        finalSlug,
        about,
        theme,
        hours,
        heroTitle,
        heroSubtitle,
        heroBadge,
        websiteId,
      ],
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
              INSERT INTO services (
                website_id,
                name
              )
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
      websiteId,
      siteName: finalSiteName,
      siteSlug: finalSlug,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Save website error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "That website slug is already in use. Please choose another name.",
      });
    }

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
      siteName,
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
    // VERIFY OWNERSHIP
    // ------------------------------------------------

    const websiteResult = await client.query(
      `
        SELECT
          w.id,
          w.business_id,
          w.site_name,
          w.site_slug
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
    const websiteId = websiteResult.rows[0].id;

    const existingSiteName = websiteResult.rows[0].site_name;
    const existingSiteSlug = websiteResult.rows[0].site_slug;

    // ------------------------------------------------
    // SITE NAME
    //
    // Site name can change.
    // ------------------------------------------------

    const finalSiteName = String(
      siteName?.trim() ||
        businessName?.trim() ||
        existingSiteName?.trim() ||
        "My Website",
    ).trim();

    // ------------------------------------------------
    // SITE SLUG
    //
    // Existing REAL slug is permanent.
    //
    // A temporary website-ID slug can be replaced
    // once the customer provides a real name.
    // ------------------------------------------------

    const temporarySlug = `website-${websiteId}`;

    let finalSlug = existingSiteSlug;

    if (!finalSlug || isTemporarySlug(finalSlug, websiteId)) {
      finalSlug = createSlug(finalSiteName);

      if (!finalSlug) {
        finalSlug = temporarySlug;
      }

      // Only check uniqueness when creating a
      // real slug.
      if (finalSlug !== temporarySlug) {
        const existingSlug = await client.query(
          `
            SELECT id
            FROM websites
            WHERE site_slug = $1
              AND id <> $2
            LIMIT 1
          `,
          [finalSlug, websiteId],
        );

        if (existingSlug.rows.length > 0) {
          finalSlug = `${finalSlug}-${websiteId}`;
        }
      }
    }

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
      [businessName || finalSiteName, phone, whatsapp, address, businessId],
    );

    // ------------------------------------------------
    // UPDATE WEBSITE
    // ------------------------------------------------

    await client.query(
      `
        UPDATE websites
        SET
          site_name = $1,
          site_slug = $2,
          about = $3,
          theme = $4,
          hours = $5,
          hero_title = $6,
          hero_subtitle = $7,
          hero_badge = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `,
      [
        finalSiteName,
        finalSlug,
        about,
        theme,
        hours,
        heroTitle,
        heroSubtitle,
        heroBadge,
        websiteId,
      ],
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
              INSERT INTO services (
                website_id,
                name
              )
              VALUES ($1, $2)
            `,
            [websiteId, service.trim()],
          );
        }
      }
    }

    await client.query("COMMIT");

    return res.json({
      message: "Website updated successfully",
      websiteId: Number(websiteId),
      siteName: finalSiteName,
      siteSlug: finalSlug,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update website error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "That website slug is already in use. Please choose another name.",
      });
    }

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
