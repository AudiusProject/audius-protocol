import BN from "bn.js";
import chalk from "chalk";
import { program } from "commander";

import { parseSplWallet, initializeAudiusLibs } from "./utils.mjs";

program.command("tip-audio")
  .description("Send a tip")
  .argument("<account>", "The account to mint tokens for; can be a @handle, #userId, or splWallet")
  .argument("<amount>", "The amount of tokens to tip (in wei)")
  .option("-f, --from <from>", "The account to tip from")
  .action(async (account, amount, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from);
    const splWallet = await parseSplWallet(account);

    try {
      const { res: tx } = await audiusLibs.solanaWeb3Manager.transferWAudio(splWallet, new BN(amount));
      console.log(chalk.green("Successfully tipped audio"));
      console.log(chalk.yellow("Transaction Signature:"), tx);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
