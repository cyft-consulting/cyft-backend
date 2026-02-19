import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/sendPasswordResetEmail.js";
import crypto from "crypto";

export const login = (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

// Request password reset
export const requestPasswordReset = async (req, res) => {
  console.log("🔐 Password reset requested:", req.body.email);
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?")
      .get(email.toLowerCase());

    if (!user) {
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = Date.now() + 60 * 60 * 1000;

    db.prepare(`
      UPDATE users
      SET resetToken = ?, resetTokenExpiry = ?
      WHERE id = ?
    `).run(hashedToken, expiry, user.id);

    console.log("📨 Sending reset email to:", user.email);

    const resetLink =
      `https://cyftconsulting.com/staff/reset-password?token=${rawToken}&email=${user.email}`;

    await sendPasswordResetEmail(user.email, resetLink);

    res.json({ message: "If the email exists, a reset link has been sent" });
    console.log("✅ Reset email sent");


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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = db.prepare(`
      SELECT * FROM users
      WHERE email = ?
        AND resetToken = ?
        AND resetTokenExpiry > ?
    `).get(email.toLowerCase(), hashedToken, Date.now());

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.prepare(`
      UPDATE users
      SET password = ?, resetToken = NULL, resetTokenExpiry = NULL
      WHERE id = ?
    `).run(hashedPassword, user.id);

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


