import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendPasswordResetEmail = async (recipient, resetLink) => {
  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const api = new SibApiV3Sdk.TransactionalEmailsApi();

  const email = {
    sender: {
      email: process.env.BREVO_EMAIL,
      name: "Cyft Consulting",
    },
    to: [{ email: recipient }],
    subject: "Reset your Cyft password",
    htmlContent: `
      <div style="background:#f6f6f6;padding:24px;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="background:#DE6328;padding:20px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;">
              Password Reset
            </h1>
          </div>

          <!-- Body -->
          <div style="padding:24px;color:#333333;">
            <p style="font-size:15px;">Hello 👋</p>

            <p style="font-size:15px;line-height:1.6;">
              You requested to reset your Cyft account password.  
              Click the button below to continue.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:24px 0;">
              <a href="${resetLink}"
                 style="
                   display:inline-block;
                   padding:14px 22px;
                   background:#DE6328;
                   color:#ffffff;
                   text-decoration:none;
                   border-radius:8px;
                   font-weight:600;
                   font-size:14px;
                 ">
                Reset Password
              </a>
            </div>

            <p style="font-size:14px;line-height:1.6;">
              This link will expire in <strong>1 hour</strong> for security reasons.
            </p>

            <p style="font-size:14px;color:#666666;">
              If you did not request a password reset, you can safely ignore this email.
            </p>

            <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />

            <p style="font-size:12px;color:#999999;">
              © ${new Date().getFullYear()} Cyft Consulting. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
Hello 👋

You requested to reset your Cyft password.

Use the link below to continue:
${resetLink}

This link expires in 1 hour.

If you didn’t request this, you can ignore this email.

© Cyft Consulting
    `,
  };

  try {
    await api.sendTransacEmail(email);
    console.log(`Password reset email sent to ${recipient}`);
  } catch (err) {
    console.error("Brevo send failed:", err?.response?.text || err);
  }
};
