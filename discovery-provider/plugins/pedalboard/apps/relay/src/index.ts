import App from "basekit/src/app";
import { webServer } from "./server";

type SharedData = {};

const main = async () => {
  // TODO: read in and validate process.env
  // TODO: connect to libs/sdk

  await new App<SharedData>({})
    .tick({ minutes: 5 }, async (app) => {
      /** TODO: update and cache health check */
    })
    .tick({ seconds: 10 }, async (app) => {
      /** TODO: check health of local node */
    })
    .tick({ minutes: 10 }, async (app) => {
      /** TODO: fund relayer wallets if empty */
    })
    .task(webServer)
    .run();
};

(async () => {
  await main().catch(console.error);
})();
