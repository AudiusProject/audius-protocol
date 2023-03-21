import listenOn from "./db.js";
import dotenv from "dotenv";
import tracksHandler from "./handlers/tracks.js";
import usersHandler from "./handlers/users.js";

const main = async () => {
  console.log("verified uploads bot starting");
  const tracks = listenOn("tracks", tracksHandler).catch(console.error);
  const users = listenOn("users", usersHandler).catch(console.error);
  await Promise.allSettled([tracks, users]);
};

main();
