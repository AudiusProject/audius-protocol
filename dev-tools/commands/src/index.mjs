#!/usr/bin/env node

import { program } from "commander";

import "./create-playlist.mjs";
import "./edit-playlist.mjs";
import "./create-user.mjs";
import "./edit-user.mjs";
import "./favorite-track.mjs";
import "./unfavorite-track.mjs";
import "./favorite-playlist.mjs";
import "./unfavorite-playlist.mjs";
import "./follow.mjs";
import "./unfollow.mjs";
import "./mint-audio.mjs";
import "./repost-track.mjs";
import "./repost-playlist.mjs";
import "./tip-audio.mjs";
import "./auth-headers.mjs";
import "./upload-track.mjs";
import "./edit-track.mjs";

async function main() {
  program.parseAsync(process.argv);
}

main();
