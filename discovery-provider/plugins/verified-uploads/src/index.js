import listen from "./db.js";
import dotenv from "dotenv";
import handler from "./handler.js";

const main = async () => {
  dotenv.config();

  const { SLACK_TOKEN, SLACK_CHANNEL, DB_URL } = process.env;

  await listen(DB_URL, handler).catch(console.error);
};

main();
