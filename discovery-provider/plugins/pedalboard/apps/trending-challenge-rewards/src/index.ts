import { log } from "logger";
import { main } from "./main";

(async () => {
  await main().catch(console.error);
})();
