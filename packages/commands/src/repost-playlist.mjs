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
      const response = await audiusLibs.EntityManager.repostPlaylist(playlistId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully reposted playlist"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
