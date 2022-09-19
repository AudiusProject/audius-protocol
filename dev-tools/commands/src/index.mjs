import { program } from "commander";

import "./create-playlist.mjs";
import "./create-user.mjs";
import "./favorite-track.mjs";
import "./favorite-playlist.mjs";
import "./follow.mjs";
import "./mint-audio.mjs";
import "./repost-track.mjs";
import "./repost-playlist.mjs";
import "./tip-audio.mjs";
import "./unfollow.mjs";
import "./auth-headers.mjs";

async function main() {
  program.parseAsync(process.argv);
}

main();
