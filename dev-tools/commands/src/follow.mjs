import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs, parseUserId } from "./utils.mjs";

program.command("follow")
  .description("Follow user")
  .argument("<account>", "The account to follow; can be a @handle or #userId")
  .option("-f, --from <from>", "The account to follow from")
  .action(async (account, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);
    const userId = await parseUserId(account);

    try {
      const { transactionHash } = await audiusLibs.User.addUserFollow(userId);
      console.log(chalk.green("Successfully followed user"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
