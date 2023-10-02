import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("favorite-track")
  .description("Favorite track")
  .argument("<trackId>", "Id of the track to favorite", Number)
  .option("-f, --from <from>", "The account to favorite track from")
  .action(async (trackId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.saveTrack(trackId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully favorited track"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
