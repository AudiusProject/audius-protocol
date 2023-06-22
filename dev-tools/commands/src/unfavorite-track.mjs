import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("unfavorite-track")
  .description("Unfavorite track")
  .argument("<trackId>", "Id of the track to unfavorite", Number)
  .option("-f, --from <from>", "The account to unfavorite track from")
  .action(async (trackId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.unsaveTrack(trackId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully unfavorited track"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
