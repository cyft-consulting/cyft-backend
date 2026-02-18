import axios from "axios";

export const sendTempPasswordEmail = async (recipient, tempPassword) => {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_USER_EMAIL,
  } = process.env;

  // 1️⃣ Get access token from refresh token
  const tokenRes = await axios.post(
    "https://accounts.zoho.com/oauth/v2/token",
    null,
    {
      params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      },
    }
  );

  const accessToken = tokenRes.data.access_token;

  // 2️⃣ Send the email
  const emailPayload = {
    fromAddress: ZOHO_USER_EMAIL,
    toAddress: recipient,
    subject: "Welcome to Cyft",
    content: `Hello! Your temporary password is: ${tempPassword}`,
  };

  try {
    await axios.post(
      "https://mail.zoho.com/api/accounts/me/messages",
      emailPayload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Email sent to ${recipient}`);
  } catch (err) {
    console.error("Failed to send email via Zoho API:", err.response?.data || err.message);
    throw err;
  }
};
