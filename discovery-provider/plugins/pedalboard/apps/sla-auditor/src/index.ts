import { log } from "logger";
import App from "basekit/src/app";

type SharedData = {};

const main = async () => {
  await new App<SharedData>({})
    .run();
};

(async () => {
  await main().catch(log);
})();
