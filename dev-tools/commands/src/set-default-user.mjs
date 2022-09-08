import { mkdir, writeFile } from "fs/promises";
import path from "path";

import chalk from "chalk";
import { program } from "commander";

import { ACCOUNTS_PATH } from "./utils.mjs";

program.command("set-defaut-user")
  .description("Set default user")
  .argument("<handle>", "The handle for the user")
  .action(async (handle) => {
    process.exit(0);
  });
