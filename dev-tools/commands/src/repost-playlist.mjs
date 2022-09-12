import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("repost-playlist")
  .description("Repost playlist")
  .argument("<playlistId>", "Id of playlist to repost", Number)
  .option("-f, --from <from>", "The account to repost playlist from")
  .action(async (playlistId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const { transactionHash } = await audiusLibs.Playlist.addPlaylistRepost(playlistId);
      console.log(chalk.green("Successfully reposted playlist"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
