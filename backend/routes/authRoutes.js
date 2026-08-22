const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Start transaction
    await client.query("BEGIN");

    // Check whether email already exists
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Create user
    const userResult = await client.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
      `,
      [name, email, passwordHash],
    );

    const user = userResult.rows[0];

    // 2. Create business
    const businessResult = await client.query(
      `
      INSERT INTO businesses
        (user_id, name, phone, whatsapp, address)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name
      `,
      [user.id, `${name} Auto Care`, "", "", ""],
    );

    const business = businessResult.rows[0];

    // 3. Create website
    const websiteResult = await client.query(
      `
      INSERT INTO websites
        (business_id, about, logo, theme, hours)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id, business_id, about, logo, theme, hours
      `,
      [
        business.id,
        "Reliable bike service and repair.",
        null,
        "blue",
        "Mon - Sat: 9 AM - 7 PM",
      ],
    );

    const website = websiteResult.rows[0];

    // 4. Create default services
    const defaultServices = [
      "General Service",
      "Oil Change",
      "Brake Repair",
      "Engine Repair",
    ];

    for (const service of defaultServices) {
      await client.query(
        `
        INSERT INTO services (website_id, name)
        VALUES ($1, $2)
        `,
        [website.id, service],
      );
    }

    // Everything succeeded
    await client.query("COMMIT");

    res.status(201).json({
      message: "User and workspace created successfully",
      user,
      business,
      website,
      services: defaultServices,
    });
  } catch (error) {
    // Something failed → undo everything
    await client.query("ROLLBACK");

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const result = await pool.query(
      `
      SELECT id, name, email, password, role
      FROM users
      WHERE email = $1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Login successful
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

module.exports = router;
