import chalk from "chalk";
import { program } from "commander";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";

import { parseSplWallet, initializeAudiusLibs } from "./utils.mjs"

program.command("get-audio-balance")
  .description("Get $AUDIO balance")
  .argument("<account>", "The account to mint tokens for; can be a @handle, #userId, or splWallet")
  .action(async (account, amount) => {
    const audiusLibs = await initializeAudiusLibs();
    const splWallet = await parseSplWallet(account);

    const balance = await audiusLibs.solanaWeb3Manager.getWAudioBalance(splWallet);
    console.log(chalk.green(`Balance: ${balance}`));

    process.exit(0);
  });

