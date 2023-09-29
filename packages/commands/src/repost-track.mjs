import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("repost-track")
  .description("Repost track")
  .argument("<trackId>", "Id of the track to repost", Number)
  .option("-f, --from <from>", "The account to repost track from")
  .action(async (trackId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.repostTrack(trackId)

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully reposted track"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
