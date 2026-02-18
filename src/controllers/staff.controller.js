import db from "../db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { sendTempPasswordEmail } from "../utils/sendTempPasswordEmail.js";

// Get all staff
export const getAllStaff = (req, res) => {
  const staff = db
    .prepare(`
      SELECT id, name, email, role, department, dateCreated, isActive 
      FROM users 
      WHERE role = 'STAFF'
    `)
    .all();

  res.json(staff);
};

// Create staff
export const createStaff = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ message: "Name, email, and department are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = db
      .prepare(`SELECT 1 FROM users WHERE email = ? LIMIT 1`)
      .get(normalizedEmail);  

    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = bcrypt.hashSync(tempPassword, 10);
    const dateCreated = new Date().toISOString();

    // Insert staff into database
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, department, dateCreated, isActive)
      VALUES (?, ?, ?, ?, 'STAFF', ?, ?, 1)
    `).run(uuidv4(), name, normalizedEmail, hashedPassword, department, dateCreated);

    // Respond immediately
    res.status(201).json({ message: "Staff created successfully" });

    // Send email asynchronously (does NOT block response)
    sendTempPasswordEmail(normalizedEmail, tempPassword)
      .then(() => console.log(`Temporary password sent to ${normalizedEmail}`))
      .catch((emailErr) => {
        console.error("Failed to send email:", emailErr);
        // Optionally, log to a database table for retry
      });

  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Delete staff
export const deleteStaff = (req, res) => {
  const { id, email } = req.body; // <-- send email from frontend too

  // Delete staff by ID AND by email to be 100% sure
  const result = db.prepare("DELETE FROM users WHERE id = ? OR email = ?").run(id, email);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Staff not found" });
  }

  res.json({ message: "Staff deleted completely" });
};
