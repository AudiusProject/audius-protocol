import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("favorite-playlist")
  .description("Repost playlist")
  .argument("<playlistId>", "Id of playlist to favorite", Number)
  .option("-f, --from <from>", "The account to favorite playlist from")
  .action(async (playlistId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const { transactionHash } = await audiusLibs.Playlist.addPlaylistSave(playlistId);
      console.log(chalk.green("Successfully favorited playlist"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
