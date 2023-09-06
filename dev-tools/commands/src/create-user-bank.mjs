import chalk from "chalk";
import { program, Option } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program
  .command("create-user-bank")
  .description("Create userbank for a user")
  .argument(
    "[handle]",
    "The handle for the user (or defaults to last logged in)"
  )
  .addOption(
    new Option("-m, --mint [mint]", "The mint for which to make a user bank")
      .choices(["audio", "usdc"])
      .default("audio")
  )
  .action(async (handle, { mint }) => {
    const audiusLibs = await initializeAudiusLibs(handle);

    try {
      const response =
        await audiusLibs.solanaWeb3Manager.createUserBankIfNeeded({
          mint,
        });

      if (response.error) {
        program.error(chalk.red(response.error));
      }

      if (response.didExist) {
        console.log(chalk.green("Userbank already exists!"));
      } else {
        console.log(chalk.green("Successfully created userbank!"));
      }
      console.log(
        chalk.yellow.bold("User bank: "),
        response.userbank.toString()
      );
      console.log(chalk.yellow.bold("Mint:      "), mint);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
