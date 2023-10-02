import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("follow")
  .description("Follow user")
  .argument("<userId>", "The user id to follow", Number)
  .option("-f, --from <from>", "The account to follow from")
  .action(async (userId, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const response = await audiusLibs.EntityManager.followUser(userId);

      if (response.error) {
        program.error(chalk.red(response.error));
      }
      console.log(chalk.green("Successfully followed user"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
