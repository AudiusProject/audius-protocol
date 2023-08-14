import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";
import { ethers } from "ethers";
import { WalletManager, regenerateWallets } from "./walletManager";
import { logger } from "./logger";
import { initializeDiscoveryDb } from "basekit/src";
import { connectWeb3 } from "./web3";

export type SharedData = {
  config: Config;
  web3: ethers.providers.JsonRpcProvider;
  wallets: WalletManager;
};

export const config = readConfig();
export const discoveryDb = initializeDiscoveryDb(
  config.discoveryDbConnectionString
);

const main = async () => {
  const { web3, chainId } = await connectWeb3(config);
  config.acdcChainId = chainId.toString();

  const wallets = new WalletManager(web3);

  const appData = {
    config,
    web3,
    wallets,
  };

  const app = new App<SharedData>({ appData, discoveryDb })
    .tick({ minutes: 5 }, async (app) => {
      /** TODO: update and cache health check */
    })
    .tick({ seconds: 10 }, async (app) => {
      /** TODO: check health of local node */
    })
    .tick({ hours: 6 }, regenerateWallets)
    .task(webServer);
  await app.run();
};

main().catch(logger.error.bind(logger));
