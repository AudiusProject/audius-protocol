import { program } from "commander";

import "./create-user.mjs";
import "./mint-audio.mjs";

async function main() {
  program.parseAsync(process.argv);
}

main();
