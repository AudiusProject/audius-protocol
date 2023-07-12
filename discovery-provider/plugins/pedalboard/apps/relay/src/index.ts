import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";
import { ethers } from "ethers";
import { WalletManager, releaseWallets } from "./walletManager";
import { logger } from "./logger";

export type SharedData = {
  config: Config,
  web3: ethers.providers.JsonRpcProvider,
  wallets: WalletManager
};

const main = async () => {
  const config = readConfig()
  const web3 = new ethers.providers.JsonRpcProvider()
  const wallets = new WalletManager(config.relayWallets)

  logger.info("read config, setup web3, and created wallets")

  const appData = {
    config,
    web3,
    wallets
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
    // every 30 seconds release wallets whose locks have expired
    .tick({ seconds: 30 }, releaseWallets)
    .task(webServer)
    .run();
};


main().catch(logger.error);
