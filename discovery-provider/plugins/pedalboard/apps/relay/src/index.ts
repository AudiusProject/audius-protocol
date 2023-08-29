import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";
import { ethers } from "ethers";
import { logger } from "./logger";
import { initializeDiscoveryDb } from "basekit/src";
import { connectWeb3 } from "./web3";

export type SharedData = {
  config: Config;
  web3: ethers.providers.JsonRpcProvider;
};

export const config = readConfig();

if (!config.aao.useAao) {
  logger.warn("anti abuse not configured and won't be enforced");
}

export const discoveryDb = initializeDiscoveryDb(
  config.discoveryDbConnectionString
);

const main = async () => {
  const { web3, chainId } = await connectWeb3(config);
  config.acdcChainId = chainId.toString();

  const appData = {
    config,
    web3,
  };

  const app = new App<SharedData>({ appData, discoveryDb })
    .tick({ minutes: 5 }, async (app) => {
      /** TODO: update and cache health check */
    })
    .tick({ seconds: 10 }, async (app) => {
      /** TODO: check health of local node */
    })
    .task(webServer);
  await app.run();
};

main().catch(logger.error.bind(logger));
