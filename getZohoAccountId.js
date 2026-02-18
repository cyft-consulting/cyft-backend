// getZohoAccountId.js
import axios from "axios";

const accessToken = "1000.2aecc7fa6f387e36918c04f29669e756.e01f425409d448b2b4dcefb4a5a1ca7a";

async function getAccountId() {
  try {
    const res = await axios.get(
      "https://mail.zoho.com/api/accounts",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    console.log("Zoho accounts response:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(
      err.response?.data || err.message
    );
  }
}

getAccountId();
