import chalk from "chalk";
import { program } from "commander";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintTo, getAssociatedTokenAddress } from "@solana/spl-token";
import { default as axios } from "axios";

program.command("mint-audio")
  .description("Mint $AUDIO tokens")
  .argument("<account>", "The account to mint tokens for; can be a handle, user id, or solana address")
  .argument("<amount>", "The amount of tokens to mint")
  .action(async (account, amount) => {
    if (!process.env.SOLANA_ENDPOINT) {
      program.error("SOLANA_ENDPOINT environment variable not set");
    }

    const connection = new Connection(process.env.SOLANA_ENDPOINT);
    const feePayer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_FEEPAYER_SECRET_KEY)));
    const tokenMint = new PublicKey(process.env.SOLANA_TOKEN_MINT_PUBLIC_KEY);
    const mintAuthority = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_OWNER_SECRET_KEY)));

    let address;
    if (account.startsWith("@")) { // handle
      try {
        ({ data: { splWallet: address } } = await axios.get(
          `users/handle/${account.slice(1)}`,
          { baseURL: "http://discovery-provider:5000/v1" },
        ));
      } catch (err) {
        program.error(`Could not find user with handle ${account}`);
      }
    } else if (account.length < 32) { // user id
      try {
        ({ data: { splWallet: address } } = await axios.get(
          `users/${account}`,
          { baseURL: "http://discovery-provider:5000/v1" },
        ));
      } catch (err) {
        program.error(`Could not find user with user id ${account}`);
      }
    } else { // solana address
      address = account;
    }

    const destination = new PublicKey(address);
    const destinationTokenAccount = await getAssociatedTokenAddress(tokenMint, destination);

    try {
      const tx = await mintTo(connection, feePayer, tokenMint, destinationTokenAccount, mintAuthority, amount);
      console.log(chalk.green("Successfully minted audio"));
      console.log(chalk.yellow("Transaction Signature:"), tx);
    } catch (err) {
      program.error(`Failed to mint audio ${err.message}`);
    }

    process.exit(0);
  });
  