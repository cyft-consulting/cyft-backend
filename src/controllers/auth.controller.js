import db from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendTempPasswordEmail } from "../utils/sendTempPasswordEmail.js";

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
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600 * 1000; // 1 hour expiry

    db.prepare("UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?")
      .run(resetToken, resetTokenExpiry, user.id);

    const resetLink = `https://cyftconsulting.com/reset-password?token=${resetToken}&email=${user.email}`;

    await sendTempPasswordEmail(user.email, `Click to reset your password:\n${resetLink}`);

    res.json({ message: "Password reset link sent to your email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetToken || user.resetToken !== token || Date.now() > user.resetTokenExpiry) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.prepare(`
      UPDATE users
      SET password = ?, resetToken = NULL, resetTokenExpiry = NULL
      WHERE id = ?
    `).run(hashedPassword, user.id);

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

