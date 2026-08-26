const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

/*
  GET ALL USERS
  GET /api/admin/users

  Returns:
  - User information
  - Business information
  - Website information
  - Permanent website slug
*/
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,

        b.name AS "businessName",

        w.id AS "websiteId",
        w.site_name AS "siteName",
        w.site_slug AS "siteSlug"

      FROM users u

      LEFT JOIN businesses b
        ON b.user_id = u.id

      LEFT JOIN websites w
        ON w.business_id = b.id

      ORDER BY u.id DESC
    `);

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    res.status(500).json({
      message: "Failed to load users",
      error: error.message,
    });
  }
});

/*
  DELETE CUSTOMER
  DELETE /api/admin/users/:id
*/
router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = Number(req.params.id);

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      // ---------------------------------------------
      // CHECK USER EXISTS
      // ---------------------------------------------

      const userResult = await client.query(
        `
        SELECT
          id,
          name,
          email,
          role
        FROM users
        WHERE id = $1
        `,
        [userId],
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = userResult.rows[0];

      // ---------------------------------------------
      // NEVER ALLOW DELETING ADMIN
      // ---------------------------------------------

      if (user.role === "admin") {
        return res.status(403).json({
          message: "Admin users cannot be deleted",
        });
      }

      await client.query("BEGIN");

      // businesses, websites and services will be
      // deleted automatically because of ON DELETE CASCADE
      await client.query(
        `
        DELETE FROM users
        WHERE id = $1
        `,
        [userId],
      );

      await client.query("COMMIT");

      res.json({
        message: "Customer deleted successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Delete customer error:", error);

      res.status(500).json({
        message: "Failed to delete customer",
        error: error.message,
      });
    } finally {
      client.release();
    }
  },
);

/*
  CREATE CUSTOMER
  POST /api/admin/users
*/
router.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    await client.query("BEGIN");

    // ---------------------------------------------
    // CHECK IF EMAIL ALREADY EXISTS
    // ---------------------------------------------

    const existingUser = await client.query(
      `
        SELECT id
        FROM users
        WHERE email = $1
        `,
      [email],
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // ---------------------------------------------
    // HASH PASSWORD
    // ---------------------------------------------

    const passwordHash = await bcrypt.hash(password, 10);

    // ---------------------------------------------
    // CREATE USER
    // ---------------------------------------------

    const userResult = await client.query(
      `
        INSERT INTO users
          (name, email, password, role)
        VALUES
          ($1, $2, $3, 'customer')
        RETURNING
          id,
          name,
          email,
          role,
          created_at
        `,
      [name, email, passwordHash],
    );

    const user = userResult.rows[0];

    // ---------------------------------------------
    // CREATE EMPTY BUSINESS
    // ---------------------------------------------

    const businessResult = await client.query(
      `
        INSERT INTO businesses
          (
            user_id,
            name,
            phone,
            whatsapp,
            address
          )
        VALUES
          ($1, '', '', '', '')
        RETURNING
          id,
          user_id,
          name
        `,
      [user.id],
    );

    const business = businessResult.rows[0];

    // ---------------------------------------------
    // CREATE EMPTY WEBSITE
    // ---------------------------------------------

    const websiteResult = await client.query(
      `
        INSERT INTO websites
          (
            business_id,
            about,
            logo,
            theme,
            hours,
            hero_title,
            hero_subtitle,
            hero_badge
          )
        VALUES
          ($1, '', NULL, $2, '', NULL, NULL, NULL)
        RETURNING
          id,
          business_id,
          about,
          logo,
          theme,
          hours,
          hero_title,
          hero_subtitle,
          hero_badge
        `,
      [business.id, "blue"],
    );

    const website = websiteResult.rows[0];

    // ---------------------------------------------
    // NO DEFAULT SERVICES
    //
    // Customer starts with zero services.
    // Services will be added from the website editor.
    // ---------------------------------------------

    await client.query("COMMIT");

    res.status(201).json({
      message: "Customer created successfully",
      user,
      business,
      website,
      services: [],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Admin create user error:", error);

    res.status(500).json({
      message: "Failed to create customer",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
