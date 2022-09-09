import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs, parseUserId } from "./utils.mjs";

program.command("unfollow")
  .description("Unfollow user")
  .argument("<account>", "The account to unfollow; can be a @handle or #userId")
  .option("-f, --from <from>", "The account to unfollow from")
  .action(async (account, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);
    const userId = await parseUserId(account);

    try {
      const { transactionHash } = await audiusLibs.User.deleteUserFollow(userId);
      console.log(chalk.green("Successfully unfollowed user"));
      console.log(chalk.yellow("Transaction Hash:"), transactionHash);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
