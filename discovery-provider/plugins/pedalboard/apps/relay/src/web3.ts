import { ethers } from "ethers";
import { Config } from "./config/config";
import { logger } from "./logger";

export type Web3Result = {
  web3: ethers.providers.JsonRpcProvider;
  chainId: string;
};

export const connectWeb3 = async (config: Config): Promise<Web3Result> => {
  const { rpcEndpoint, rpcEndpointFallback } = config;
  let attempts = 3;
  while (attempts != 0) {
    // TODO: check nethermind specific health here
    try {
      const web3 = new ethers.providers.JsonRpcProvider(rpcEndpoint);
      const { chainId } = await web3.getNetwork();
      return { web3, chainId: chainId.toString() };
    } catch (e) {
      attempts -= 1;
      logger.warn(
        `could not connect to ${rpcEndpoint} attempts left ${attempts} ${e}`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  console.warn(`falling back to ${rpcEndpointFallback}`);
  const web3 = new ethers.providers.JsonRpcProvider(rpcEndpointFallback);
  const { chainId } = await web3.getNetwork();
  return { web3, chainId: chainId.toString() };
};
