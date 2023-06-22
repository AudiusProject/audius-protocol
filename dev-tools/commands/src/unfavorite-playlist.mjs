import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("unfavorite-playlist")
  .description("Unfavorite playlist")
  .argument("<playlistId>", "Id of playlist to unfavorite", Number)
  .option("-f, --from <from>", "The account to unfavorite playlist from")
  .action(async (playlistId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.unsavePlaylist(playlistId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully unfavorited playlist"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
