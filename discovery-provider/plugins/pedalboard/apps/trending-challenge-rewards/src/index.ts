import { log } from "logger";
import App from "basekit/src/app";
import { SharedData, condition } from "./config";

const main = async () => {
  await new App<SharedData>({})
    .cron(condition, async (app) => {
      log("executed!");
    })
    .run();
};

(async () => {
  await main().catch(log);
})();
