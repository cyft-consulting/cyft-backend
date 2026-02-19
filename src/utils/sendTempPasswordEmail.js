import nodemailer from "nodemailer";

export const sendTempPasswordEmail = async (recipient, tempPassword) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465, // SSL
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.ZOHO_EMAIL, // info@cyftconsulting.com
      pass: process.env.ZOHO_PASSWORD, // App password if 2FA enabled
    },
  });

  try {
    await transporter.sendMail({
      from: `"Cyft Consulting" <${process.env.ZOHO_EMAIL}>`,
      to: recipient,
      subject: "Welcome to Cyft",
      text: `Hello 👋\n\nYour temporary password is:\n\n${tempPassword}\n\nPlease log in and change it.`,
    });

    console.log(`Email sent to ${recipient}`);
  } catch (err) {
    console.error("Failed to send email via Zoho:", err.message || err);

    // Optional fallback to admin
    await transporter.sendMail({
      from: `"Cyft Consulting" <${process.env.ZOHO_EMAIL}>`,
      to: "info@cyftconsulting.com",
      subject: `Failed to send password to ${recipient}`,
      text: `Could not send temporary password to ${recipient}.\nPassword: ${tempPassword}`,
    });
  }
};