import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program
  .command("auth-headers")
  .description(
    "Output auth headers (for use with curl: `curl -H @<(audius-cmd auth-headers)`)"
  )
  .option("-f, --from [from]", "The account for which to generate auth headers")
  .action(async ({ from }) => {
    const audiusLibs = await initializeAudiusLibs(from);

    try {
      const unixTimestamp = Math.round(new Date().getTime() / 1000);
      const message = `Click sign to authenticate with identity service: ${unixTimestamp}`;
      const signature = await audiusLibs.web3Manager.sign(message);

      console.log(chalk.yellow("Encoded-Data-Message:"), message);
      console.log(chalk.yellow("Encoded-Data-Signature:"), signature);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
