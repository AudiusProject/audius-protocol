import { log } from "logger";
import App from "basekit/src/app";
import { audit } from "./audit";

type SharedData = {};

const main = async () => {
  await new App<SharedData>({}).tick({ hours: 1 }, audit).run();
};

(async () => {
  await main().catch(log);
})();
