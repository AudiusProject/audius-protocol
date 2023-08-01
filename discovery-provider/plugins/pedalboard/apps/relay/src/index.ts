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

export const config = readConfig();
export const web3 = new ethers.providers.JsonRpcProvider(config.rpcEndpoint);
export const wallets = new WalletManager(web3);

const appData = {
  config,
  web3,
  wallets,
};

export const app = new App<SharedData>(appData)
  .tick({ minutes: 5 }, async (app) => {
    /** TODO: update and cache health check */
  })
  .tick({ seconds: 10 }, async (app) => {
    /** TODO: check health of local node */
  })
  .tick({ hours: 6 }, regenerateWallets)
  .task(webServer);

const main = async () => {
  await app.run();
};

main().catch(logger.error.bind(logger));
