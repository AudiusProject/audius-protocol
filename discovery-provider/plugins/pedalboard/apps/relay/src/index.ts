import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";

export type SharedData = {
  config: Config
};

const main = async () => {
  const config = readConfig()
  // TODO: connect to libs/sdk

  const appData = {
    config
  }

  await new App<SharedData>(appData)
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
