import postmark from "postmark";

export const sendTempPasswordEmail = async (recipient, tempPassword) => {
  const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

  try {
    await client.sendEmail({
      From: process.env.POSTMARK_SENDER_EMAIL,
      To: recipient,
      Subject: "Welcome to Cyft",
      TextBody: `Hello 👋\n\nYour temporary password is:\n\n${tempPassword}\n\nPlease log in and change it.`,
    });

    console.log(`Email sent to ${recipient}`);
  } catch (err) {
    console.error("Failed to send email via Postmark:", err.message || err);
    // Optional: send fallback to admin
    await client.sendEmail({
      From: process.env.POSTMARK_SENDER_EMAIL,
      To: "info@cyftconsulting.com",
      Subject: `Failed to send password to ${recipient}`,
      TextBody: `Could not send temporary password to ${recipient}.\nPassword: ${tempPassword}`,
    });
  }
};
