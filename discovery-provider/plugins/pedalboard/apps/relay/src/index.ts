import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";
import { ethers } from "ethers";
import { WalletManager, regenerateWallets } from "./walletManager";
import { logger } from "./logger";

export type SharedData = {
  config: Config;
  web3: ethers.providers.JsonRpcProvider;
  wallets: WalletManager;
};

const main = async () => {
  const config = readConfig();
  const web3 = new ethers.providers.JsonRpcProvider(config.rpcEndpoint);
  const wallets = new WalletManager(web3);

  const appData = {
    config,
    web3,
    wallets,
  };

  await new App<SharedData>(appData)
    .tick({ minutes: 5 }, async (app) => {
      /** TODO: update and cache health check */
    })
    .tick({ seconds: 10 }, async (app) => {
      /** TODO: check health of local node */
    })
    .tick({ hours: 6 }, regenerateWallets)
    .task(webServer)
    .run();
};

main().catch(logger.error.bind(logger));
