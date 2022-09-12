import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("repost-track")
  .description("Repost track")
  .argument("<track>", "Id of the track to repost", Number)
  .option("-f, --from <from>", "The account to repost track from")
  .action(async (track, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const { transactionHash } = await audiusLibs.Track.addTrackRepost(track);
      console.log(chalk.green("Successfully reposted track"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
