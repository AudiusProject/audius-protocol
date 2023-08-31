import App from "basekit/src/app";
import { webServer } from "./server";
import { Config, readConfig } from "./config";
import { ethers } from "ethers";
import { logger } from "./logger";
import { initializeDiscoveryDb } from "basekit/src";
import { connectWeb3 } from "./web3";

/** Global Vars and Setup */

export const config = readConfig();

if (!config.aao.useAao) {
  logger.warn("anti abuse not configured and won't be enforced")
}

export const discoveryDb = initializeDiscoveryDb(
  config.discoveryDbConnectionString
);

export let web3: ethers.providers.JsonRpcProvider;
export let chainId: string;

const main = async () => {
  // async setup before web server starts
  const result = await connectWeb3(config);
  web3 = result.web3
  chainId = result.chainId
  config.acdcChainId = chainId.toString();

  await webServer()
};

main().catch(logger.error.bind(logger));
