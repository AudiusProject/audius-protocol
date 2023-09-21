import { dp_db } from "../db.js";
import { slack } from "../slack.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const { IDENTITY_URL, USERS_SLACK_CHANNEL } = process.env;
const social_handle_url = (handle) =>
  `${IDENTITY_URL}/social_handles?handle=${handle}`;

export default async ({ user_id }) => {
  const result = await dp_db("users")
    .select("handle", "is_verified")
    .where("user_id", "=", user_id)
    .whereIn("is_current", ["true", "false"])
    .orderBy("blocknumber", "desc")
    .limit(2)
    .catch(console.error);
  if (result.length == 2) {
    const current = result[0];
    const old = result[1];

    if (current.is_verified !== old.is_verified) {
      const is_verified = current.is_verified;
      const handle = current.handle;

      // GET https://identityservice.staging.audius.co/social_handles?handle=totallynotalec
      const { data } = await axios
        .get(social_handle_url(handle))
        .catch(console.error);

      const { twitterVerified, instagramVerified, tikTokVerified } = data;

      let source = "unknown";
      if (twitterVerified) {
        source = "twitter";
      }
      if (instagramVerified) {
        source = "instagram";
      }
      if (tikTokVerified) {
        source = "tiktok";
      }

      const header = `User *${handle}* ${
        is_verified ? "is now" : "is no longer"
      } verified via ${source}!`;

      const body = {
        userId: user_id,
        handle,
        link: `https://audius.co/${handle}`,
        source,
      };
      await slack
        .sendMsg(USERS_SLACK_CHANNEL, header, body)
        .catch(console.error);
    }
  }
};
