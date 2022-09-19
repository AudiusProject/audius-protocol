import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("create-playlist")
  .description("Create playlist")
  .argument("<name>", "Name of the playlist")
  .argument("<trackIds...>", "Tracks to include in playlist")
  .option("-a, --album", "Make playlist an album", false)
  .option("-p, --private", "Make playlist private", false)
  .option("-f, --from <from>", "The account to create playlist from")
  .action(async (name, trackIds, { album, private: isPrivate, from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const { transactionHash } = await audiusLibs.Playlist.createPlaylist(
        audiusLibs.userStateManager.getCurrentUserId(),
        name,
        isPrivate,
        album,
        trackIds.map(Number),
      );

      console.log(chalk.green("Successfully created playlist"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
