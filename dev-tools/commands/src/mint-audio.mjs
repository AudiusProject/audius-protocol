import chalk from "chalk";
import { program } from "commander";
import { Connection } from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";
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

    console.log(address);
  });
