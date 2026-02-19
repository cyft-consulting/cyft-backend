import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendTempPasswordEmail = async (recipient, tempPassword) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;

  // Configure API key
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
    sender: { email: process.env.BREVO_EMAIL, name: "Cyft Consulting" },
    to: [{ email: recipient, name: recipient }],
    subject: "Welcome to Cyft",
    textContent: `Hello 👋\n\nYour temporary password is:\n\n${tempPassword}\n\nPlease log in and change it.`,
  });

  try {
    await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${recipient}`);
  } catch (err) {
    console.error("Failed to send email via Brevo:", err);

    // fallback to admin
    try {
      const fallbackEmail = new SibApiV3Sdk.SendSmtpEmail({
        sender: { email: process.env.BREVO_EMAIL, name: "Cyft Consulting" },
        to: [{ email: "info@cyftconsulting.com", name: "Admin" }],
        subject: `Failed to send password to ${recipient}`,
        textContent: `Could not send temporary password to ${recipient}.\nPassword: ${tempPassword}`,
      });
      await tranEmailApi.sendTransacEmail(fallbackEmail);
    } catch (fallbackErr) {
      console.error("Failed to send fallback email:", fallbackErr);
    }
  }
};
