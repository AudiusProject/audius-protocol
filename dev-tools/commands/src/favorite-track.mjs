import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("favorite-track")
  .description("Favorite track")
  .argument("<track>", "Id of the track to favorite", Number)
  .option("-f, --from <from>", "The account to favorite track from")
  .action(async (track, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const { transactionHash } = await audiusLibs.Track.addTrackSave(track);
      console.log(chalk.green("Successfully favorited track"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
