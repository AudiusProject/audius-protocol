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

export const relayTransaction = async (_req: Request, res: Response, next: NextFunction) => {
  // pull info from validated request
  const { validatedRelayRequest } = res.locals.ctx
  const { encodedABI, gasLimit, contractAddress } = validatedRelayRequest

  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();

  // gather some transaction params
  const nonce = await web3.getTransactionCount(address);
  const to = contractAddress;
  const value = "0x00";
  const data = encodedABI;

  // assemble, sign, and send transaction
  const transaction = { nonce, gasLimit, to, value, data };
  await senderWallet.signTransaction(transaction);
  const submit = await senderWallet.sendTransaction(transaction);

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
