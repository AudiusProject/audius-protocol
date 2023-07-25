import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequestHeaders, RelayRequestType } from "./types/relay";
import {
  TransactionReceipt,
  TransactionRequest,
} from "@ethersproject/abstract-provider";
import { validateSupportedContract, validateTransactionData } from "./validate";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";
import { detectAbuse } from "./antiAbuse";
import { Users } from "storage/src";
import { Knex } from "knex";

export type RelayedTransaction = {
  receipt: TransactionReceipt;
  transaction: TransactionRequest;
};

export const relayTransaction = async (
  app: App<SharedData>,
  headers: RelayRequestHeaders,
  req: RelayRequestType
): Promise<RelayedTransaction> => {
  const requestId = uuidv4();
  const log = (obj: unknown, msg?: string | undefined, ...args: any[]) =>
    logger.info(obj, msg, requestId, ...args);
  const { web3, wallets, config } = app.viewAppData();
  const {
    entityManagerContractAddress,
    entityManagerContractRegistryKey,
    requiredConfirmations,
    aao,
  } = config;
  const { encodedABI, contractRegistryKey, gasLimit } = req;
  const { reqIp } = headers


  const { user } = await recoverUser()
  const isBlockedFromRelay = await detectAbuse(aao, user, reqIp)

  log({ msg: "new relay request", req });

  // validate transaction and select wallet
  validateSupportedContract(
    [entityManagerContractRegistryKey],
    contractRegistryKey
  );
  await validateTransactionData(encodedABI);
  const senderWallet = wallets.selectNextWallet();
  const address = await senderWallet.getAddress();
  logger.info({ senderWallet });

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

  // internally polls until mined
  const receipt = await submit.wait(requiredConfirmations);

  return { receipt, transaction };
};

const recoverUser = async (discoveryDb: Knex, headers: RelayRequestHeaders): Promise<Users> => {
  const signer = sigUtil.recoverTypedSignature({
    sig: 
  })
  return {}
}
