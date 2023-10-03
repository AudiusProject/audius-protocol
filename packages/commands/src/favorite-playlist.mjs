import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("favorite-playlist")
  .description("Favorite playlist")
  .argument("<playlistId>", "Id of playlist to favorite", Number)
  .option("-f, --from <from>", "The account to favorite playlist from")
  .action(async (playlistId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.savePlaylist(playlistId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully favorited playlist"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
