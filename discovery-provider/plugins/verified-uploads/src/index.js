import listenOn from "./db.js";
import dotenv from "dotenv";
import handler from "./handler.js";
import Slack from "./slack.js";

const main = async () => {
  dotenv.config();

  console.log("verified uploads bot starting");

  const slack = Slack();
  await listenOn("tracks", { slack }, handler).catch(console.error);
};

main();
