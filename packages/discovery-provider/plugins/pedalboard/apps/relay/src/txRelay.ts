import { config, wallets, web3 } from ".";
import { internalError } from "./error";
import { logger } from "./logger";
import { confirm } from "./web3";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { NextFunction, Request, Response } from "express";
import { coerceErrorToString } from "./utils";

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
  const { validatedRelayRequest, requestId } = res.locals.ctx;
  const { encodedABI, gasLimit, contractAddress } = validatedRelayRequest;

  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();
  let nonce = undefined
  let submit = undefined
  try {
    // gather some transaction params
    nonce = await web3.getTransactionCount(address);

    const to = contractAddress;
    const value = "0x00";
    const data = encodedABI;

    // assemble, sign, and send transaction
    const transaction = { nonce, gasLimit, to, value, data };
    await senderWallet.signTransaction(transaction);

    logger.info({ requestId, senderWallet: address, nonce }, "submitting transaction")

    submit = await senderWallet.sendTransaction(transaction);

    // query chain until tx is mined
    const receipt = await confirm(submit.hash);
    receipt.blockNumber += config.finalPoaBlock
    logger.info({ requestId, senderWallet: address, nonce, txHash: submit?.hash, blocknumber: receipt.blockNumber }, "transaction confirmation successful")
    res.send({ receipt });
  } catch (e) {
    logger.error({ requestId, error: coerceErrorToString(e), senderWallet: address, nonce, txHash: submit?.hash }, "transaction confirmation failed")
    internalError(next, e);
    return;
  }
  next();
};
