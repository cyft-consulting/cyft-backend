import { pool } from "../db/postgres.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRes = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    const user = userRes.rows[0];

    if (!user || !user.isactive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const userRes = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    const user = userRes.rows[0];

    if (!user) {
      // Do not reveal if email exists
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    await pool.query(
      `UPDATE users
       SET resetToken = $1, resetTokenExpiry = $2
       WHERE id = $3`,
      [hashedToken, expiry, user.id]
    );

    const resetLink = `https://cyftconsulting.com/staff/reset-password?token=${rawToken}&email=${user.email}`;

    await sendPasswordResetEmail(user.email, resetLink);

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const userRes = await pool.query(
      `SELECT * FROM users 
       WHERE email = $1 AND resetToken = $2 AND resetTokenExpiry > $3`,
      [email.toLowerCase(), hashedToken, Date.now()]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password = $1, resetToken = NULL, resetTokenExpiry = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
