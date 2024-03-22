import { ethers } from "ethers";
import { Config } from "./config/config";
import { logger } from "./logger";
import Web3 from "web3";

export let web3js: Web3;

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
      web3js = new Web3(new Web3.providers.HttpProvider(rpcEndpoint));
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
  web3js = new Web3(new Web3.providers.HttpProvider(rpcEndpointFallback));
  return { web3, chainId: chainId.toString() };
};

export const confirm = async (txHash: string | undefined, retries = 128): Promise<any> => {
  if (txHash === undefined) throw new Error("transaction hash not defined")
  let tries = 0;
  while (tries !== retries) {
    const receipt = await web3js.eth.getTransactionReceipt(txHash);
    if (receipt !== null && receipt.status) return receipt;
    await delay(500);
    tries += 1;
  }
  throw new Error(`transaction ${txHash} could not be confirmed`);
};

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
