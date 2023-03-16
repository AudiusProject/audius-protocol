import listen from "./db.js";
import dotenv from "dotenv";
import handler from "./handler.js";
import Slack from "./slack.js";

const main = async () => {
  dotenv.config();

  const { SLACK_TOKEN, SLACK_CHANNEL, DB_URL } = process.env;
  const slack = Slack(SLACK_TOKEN, SLACK_CHANNEL);
  await listen(DB_URL, { slack }, handler).catch(console.error);
};

main();
