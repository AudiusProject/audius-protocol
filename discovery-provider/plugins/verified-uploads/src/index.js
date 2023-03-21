import listenOn from "./db.js";
import dotenv from "dotenv";
import tracksHandler from "./handlers/tracks.js";
import usersHandler from "./handlers/users.js";
import Slack from "./slack.js";

const main = async () => {
  dotenv.config();

  console.log("verified uploads bot starting");

  const slack = Slack();
  const tracks = listenOn("tracks", { slack }, tracksHandler).catch(
    console.error
  );
  const users = listenOn("users", { slack }, usersHandler).catch(console.error);

  await Promise.allSettled([tracks, users]);
};

main();
