import chalk from "chalk";
import { program } from "commander";
import { default as axios } from "axios";

import { parsePOAOwnerWallet, initializeAudiusLibs } from "./utils.mjs";

program.command("follow")
  .description("Follow user")
  .argument("<account>", "The account to follow; can be a handle or user id")
  .option("-f, --from <from>", "The account to follow from; can be a handle or a private key", parsePOAOwnerWallet)
  .action(async (account, { from }) => {
    const audiusLibs = await initializeAudiusLibs();

    audiusLibs.web3Manager.setOwnerWallet(await from);

    let userId;
    if (account.startsWith("@")) { // handle
      try {
        ({ data: { data: { id: userId } } } = await axios.get(
          `users/handle/${account.slice(1)}`,
          { baseURL: "http://discovery-provider:5000/v1" },
        ));
      } catch (err) {
        throw new Error(`Could not find user with handle ${account}`);
      }
    } else { // user id
      userId = userId;
    }

    try {
      console.log(await audiusLibs.User.addUserFollow(audiusLibs.Utils.decodeHashId(userId)));
      console.log(chalk.green("Successfully followed user"));
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
