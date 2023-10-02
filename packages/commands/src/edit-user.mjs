import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("edit-user")
  .description("Update an existing user")
  .argument("<handle>", "The user's handle (can't change)")
  .option("-n, --name <name>", "The user's new name")
  .option("-b, --bio <bio>", "The user's new bio")
  .action(async (handle, { name, bio }) => {
    const audiusLibs = await initializeAudiusLibs(handle);

    const user = audiusLibs.userStateManager.getCurrentUser();
    const newMetadata = {
      ...user,
      name: name || user.name,
      bio: bio || user.bio
    }

    console.log(chalk.yellow.bold("User before update: "), user);

    try {
      const response = await audiusLibs.User.updateMetadataV2({
        newMetadata,
        userId: user.user_id
      });

      if (response.error) {
        program.error(chalk.red(response.error));
      }

      const updatedUser = audiusLibs.userStateManager.getCurrentUser();
      console.log(chalk.green("Successfully updated user!"));
      console.log(chalk.yellow.bold("User after update: "), updatedUser);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
