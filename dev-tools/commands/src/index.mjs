import { program } from "commander";

import "./create-user.mjs";
import "./mint-audio.mjs";
import "./tip-audio.mjs";
import "./follow.mjs";

async function main() {
  program.parseAsync(process.argv);
}

main();
