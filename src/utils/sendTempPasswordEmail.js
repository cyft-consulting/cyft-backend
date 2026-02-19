import SibApiV3Sdk from "sib-api-v3-sdk";

export const sendTempPasswordEmail = async (recipient, tempPassword) => {
  const client = SibApiV3Sdk.ApiClient.instance;

  client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const api = new SibApiV3Sdk.TransactionalEmailsApi();

  const email = {
    sender: {
      email: process.env.BREVO_EMAIL, // MUST be verified in Brevo
      name: "Cyft Consulting",
    },
    to: [
      {
        email: recipient,
      },
    ],
    subject: "Welcome to Cyft",
    textContent: `Hello 👋

Your temporary password is:

${tempPassword}

Please log in and change it.`,
  };

  try {
    await api.sendTransacEmail(email);
    console.log(`Email sent to ${recipient}`);
  } catch (err) {
    console.error("Brevo send failed:", err?.response?.text || err);
  }
};
