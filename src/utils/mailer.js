import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendTempPasswordEmail = async (toEmail, tempPassword) => {
  const transporter = nodemailer.createTransport({
    host: "smtppro.zoho.com",
    port: 465,
    secure: true, // true for 465
    auth: {
      user: process.env.EMAIL_USER, // e.g. info@cyftconsulting.com
      pass: process.env.EMAIL_PASS, // Zoho App Password
    },
  });

  // OPTIONAL but VERY useful (remove later)
  await transporter.verify();
  console.log("✅ Zoho SMTP verified");

  const mailOptions = {
    from: `"CYFT Admin" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Staff Account & Temporary Password",
    text: `Hello,

Your staff account has been created. Here are your login details:

Email: ${toEmail}
Temporary Password: ${tempPassword}

Please login and change your password immediately.

Thanks,
CYFT Team`,
  };

  await transporter.sendMail(mailOptions);
};
