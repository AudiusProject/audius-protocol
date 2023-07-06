import App from "basekit/src/app";
import { webServer } from "./server";

type SharedData = {};

const main = async () => {
  await new App<SharedData>({}).task(webServer).run();
};

(async () => {
  await main().catch(console.error);
})();
