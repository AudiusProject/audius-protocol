import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequest, RelayRequestHeaders } from "./types/relay";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";
import { detectAbuse } from "./antiAbuse";
import { AudiusABIDecoder } from "@audius/sdk";
import { FastifyReply } from "fastify";
import { errorResponseForbidden } from "./error";
import { ethers } from "ethers";
import { validateRequestParams } from "./validate";

export type RelayedTransaction = {
  receipt: TransactionReceipt;
  transaction: TransactionRequest;
};

export const relayTransaction = async (
  app: App<SharedData>,
  headers: RelayRequestHeaders,
  req: RelayRequest,
  rep: FastifyReply
): Promise<RelayedTransaction> => {
  const requestId = uuidv4();
  const log = (obj: unknown, msg?: string | undefined, ...args: any[]) =>
    logger.info(obj, msg, requestId, ...args);
  const { web3, wallets, config } = app.viewAppData();
  const {
    entityManagerContractAddress,
    aao,
  } = config;
  const { gasLimit: reqGasLimit } = req;
  const { reqIp } = headers;

  const { encodedAbi } = validateRequestParams(req)

  const discoveryDb = app.getDnDb();
  const { chainId } = await web3.getNetwork();
  const sender = AudiusABIDecoder.recoverSigner({
    encodedAbi,
    entityManagerAddress: entityManagerContractAddress,
    chainId: chainId.toString(),
  });
  const isBlockedFromRelay = await detectAbuse(aao, discoveryDb, sender, reqIp);
  if (isBlockedFromRelay) {
    errorResponseForbidden(rep);
  }

  log({ msg: "new relay request", req });

  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();

  // gather some transaction params
  const nonce = await web3.getTransactionCount(address);
  const to = entityManagerContractAddress;
  const value = "0x00";
  const data = encodedAbi;

  log({ msg: "gathered tx params", nonce });

  const gasLimit = reqGasLimit || 3000000;

  // assemble, sign, and send transaction
  const transaction = { nonce, gasLimit, to, value, data };
  await senderWallet.signTransaction(transaction);
  const submit = await senderWallet.sendTransaction(transaction);

  log("signed and sent");

  // query chain until tx is mined
  const receipt = await confirm(web3, submit.hash);
  return { receipt, transaction };
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

const isEntityManager = (contractName: string): boolean => {
  return contractName === "EntityManager"
}
