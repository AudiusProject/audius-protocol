import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequestType } from "./types/relay";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { validateSupportedContract, validateTransactionData } from "./validate";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";

export type RelayedTransaction = {
  receipt: TransactionReceipt;
  transaction: TransactionRequest;
};

export const relayTransaction = async (
  app: App<SharedData>,
  req: RelayRequestType
): Promise<RelayedTransaction> => {
  const requestId = uuidv4();
  const log = (obj: unknown, msg?: string | undefined, ...args: any[]) =>
    logger.info(obj, msg, requestId, ...args);
  const { web3, wallets, config } = app.viewAppData();
  const {
    entityManagerContractAddress,
    entityManagerContractRegistryKey,
  } = config;
  const { encodedABI, contractRegistryKey, gasLimit } = req;

  log({ msg: "new relay request", req });

  // validate transaction and select wallet
  validateSupportedContract(
    [entityManagerContractRegistryKey],
    contractRegistryKey
  );
  await validateTransactionData(encodedABI);
  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();

  // gather some transaction params
  const nonce = await web3.getTransactionCount(address);
  const to = entityManagerContractAddress;
  const value = "0x00";
  const data = encodedABI;

  log({ msg: "gathered tx params", nonce });

  // assemble, sign, and send transaction
  const transaction = { nonce, gasLimit, to, value, data };
  await senderWallet.signTransaction(transaction);
  const submit = await senderWallet.sendTransaction(transaction);

  log("signed and sent");

  // query chain until tx is mined
  const receipt = await confirm(web3, submit.hash)
  return { receipt, transaction };
};

const confirm = async (web3: ethers.providers.JsonRpcProvider, txHash: string): Promise<TransactionReceipt> => {
  const result = await Promise.race([confirmIndefinitely(web3, txHash), delay(6000)])
  if (result === undefined) throw new Error(`txhash ${txHash} could not be confirmed`)
  return result as TransactionReceipt
}

const confirmIndefinitely = async (web3: ethers.providers.JsonRpcProvider, txHash: string): Promise<TransactionReceipt> => {
  const receipt = await web3.getTransactionReceipt(txHash)
  if (receipt !== null) return receipt
  await delay(500)
  return confirmIndefinitely(web3, txHash)
}

const delay = (ms: number) => {
  return new Promise( resolve => setTimeout(resolve, ms) );
}
