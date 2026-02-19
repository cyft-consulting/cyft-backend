import { pool } from "../db/postgres.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { sendTempPasswordEmail } from "../utils/sendTempPasswordEmail.js";

/**
 * GET ALL STAFF
 */
export const getAllStaff = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, department, dateCreated, isActive, tempPassword
       FROM users
       WHERE role = 'STAFF'`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * CREATE STAFF
 */
export const createStaff = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ message: "Name, email, and department are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);
    const dateCreated = new Date().toISOString();

    // Insert staff
    await pool.query(
      `INSERT INTO users (id, name, email, password, tempPassword, role, department, dateCreated, isActive)
       VALUES ($1, $2, $3, $4, $5, 'STAFF', $6, $7, true)`,
      [uuidv4(), name, normalizedEmail, hashedPassword, tempPassword, department, dateCreated]
    );

    res.status(201).json({ message: "Staff created successfully" });

    // Send email asynchronously (non-blocking)
    sendTempPasswordEmail(normalizedEmail, tempPassword)
      .then(() => console.log(`Temporary password sent to ${normalizedEmail}`))
      .catch((emailErr) => console.error("Failed to send email:", emailErr));

  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE STAFF
 */
export const deleteStaff = async (req, res) => {
  try {
    const { id, email } = req.body;

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 OR email = $2 RETURNING *`,
      [id, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ message: "Staff deleted completely" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
