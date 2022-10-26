import chalk from "chalk";
import { program } from "commander";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";

import { parseSplWallet } from "./utils.mjs"

program.command("mint-audio")
  .description("Mint $AUDIO tokens")
  .argument("<account>", "The account to mint tokens for; can be a @handle, #userId, or splWallet")
  .argument("<amount>", "The amount of tokens to mint")
  .action(async (account, amount) => {
    if (!process.env.SOLANA_ENDPOINT) {
      program.error("SOLANA_ENDPOINT environment variable not set");
    }

    const splWallet = await parseSplWallet(account);

    const connection = new Connection(process.env.SOLANA_ENDPOINT);
    const feePayer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY)));
    const tokenMint = new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY);
    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY)));

    try {
      const tx = await mintTo(connection, feePayer, tokenMint, splWallet, mintAuthority, amount);
      console.log(chalk.green("Successfully minted audio"));
      console.log(chalk.yellow("Transaction Signature:"), tx);
    } catch (err) {
      program.error(`Failed to mint audio ${err.message}`);
    }

    process.exit(0);
  });
  
