const axios = require("axios");
const { User } = require("../models");

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

async function sendPushToUser(userId, title, message, data = {}) {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return false;
    const user = await User.findById(userId).lean();
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) return false;

    // Treat stored tokens as OneSignal player IDs
    const include_player_ids = user.fcmTokens.slice(0, 2000);

    const body = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids,
      headings: { en: title },
      contents: { en: message },
      data,
    };

    await axios.post("https://onesignal.com/api/v1/notifications", body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      timeout: 5000,
    });
    return true;
  } catch (e) {
    console.error("Push notification failed", e?.response?.data || e.message);
    return false;
  }
}

module.exports = { sendPushToUser };
