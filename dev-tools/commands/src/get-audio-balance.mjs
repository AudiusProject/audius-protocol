import chalk from "chalk";
import { program } from "commander";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";

import { parseSplWallet } from "./utils.mjs"

program.command("get-audio-balance")
  .description("Mint $AUDIO tokens")
  .argument("<account>", "The account to mint tokens for; can be a @handle, #userId, or splWallet")
  .action(async (account, amount) => {
    if (!process.env.SOLANA_ENDPOINT) {
      program.error("SOLANA_ENDPOINT environment variable not set");
    }

    const splWallet = await parseSplWallet(account);
    const connection = new Connection(process.env.SOLANA_ENDPOINT);
    const balance = await connection.getTokenAccountBalance(splWallet)
    console.log(balance.value.uiAmountString);

    process.exit(0);
  });

