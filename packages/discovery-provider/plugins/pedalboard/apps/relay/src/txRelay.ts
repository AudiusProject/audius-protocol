import { config, wallets, web3 } from ".";
import { internalError } from "./error";
import { logger } from "./logger";
import { confirm } from "./web3";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { NextFunction, Request, Response } from "express";

export type RelayedTransaction = {
  receipt: TransactionReceipt;
  transaction: TransactionRequest;
};

export const relayTransaction = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // pull info from validated request
  const { validatedRelayRequest } = res.locals.ctx;
  const { encodedABI, gasLimit, contractAddress } = validatedRelayRequest;

  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();

  // gather some transaction params
  const nonce = await web3.getTransactionCount(address);

  const balance = await web3.getBalance(address);
  const to = contractAddress;
  const value = "0x00";
  const data = encodedABI;

  // assemble, sign, and send transaction
  const transaction = { nonce, gasLimit, to, value, data };
  await senderWallet.signTransaction(transaction);
  const submit = await senderWallet.sendTransaction(transaction);

  // query chain until tx is mined
  try {
    const receipt = await confirm(submit.hash);
    receipt.blockNumber += config.finalPoaBlock
    res.send({ receipt });
  } catch (e) {
    internalError(next, e as string);
    return;
  }
  next();
};
