import { config, discoveryDb, wallets, web3 } from ".";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { validateSupportedContract, validateTransactionData } from "./validate";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";
import { detectAbuse } from "./antiAbuse";
import { AudiusABIDecoder } from "@audius/sdk";
import { ethers } from "ethers";
import { NextFunction, Request, Response } from "express";

export type RelayedTransaction = {
  receipt: TransactionReceipt;
  transaction: TransactionRequest;
};

export const relayTransaction = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const log = (obj: unknown, msg?: string | undefined, ...args: any[]) =>
    logger.info(obj, msg, requestId, ...args);
  const {
    entityManagerContractAddress,
    entityManagerContractRegistryKey,
    aao,
  } = config;
  const { encodedABI, contractRegistryKey, gasLimit: reqGasLimit } = req.body;
  const reqIp = "FIX ME";

  const { chainId } = await web3.getNetwork();
  const sender = AudiusABIDecoder.recoverSigner({
    encodedAbi: encodedABI,
    entityManagerAddress: entityManagerContractAddress,
    chainId: chainId.toString(),
  });
  const isBlockedFromRelay = await detectAbuse(aao, discoveryDb, sender, reqIp);
  if (isBlockedFromRelay) {
    throw new Error("blocked from relay");
  }

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

  const gasLimit = reqGasLimit || 3000000;

  // assemble, sign, and send transaction
  const transaction = { nonce, gasLimit, to, value, data };
  await senderWallet.signTransaction(transaction);
  const submit = await senderWallet.sendTransaction(transaction);

  log("signed and sent");

  // query chain until tx is mined
  const receipt = await confirm(web3, submit.hash);
  res.send(receipt);
  next()
};

const confirm = async (
  web3: ethers.providers.JsonRpcProvider,
  txHash: string,
  retries = 12
): Promise<TransactionReceipt> => {
  let tries = 0;
  while (tries !== retries) {
    const receipt = await web3.getTransactionReceipt(txHash);
    if (receipt !== null) return receipt;
    await delay(500);
    tries += 1;
  }
  throw new Error(`transaction ${txHash} could not be confirmed`);
};

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
