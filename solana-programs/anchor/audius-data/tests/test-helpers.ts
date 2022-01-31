import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  ethAddressToArray,
  getRandomPrivateKey,
  getTransaction,
  randomCID,
} from "../lib/utils";
import ethWeb3 from "web3";
import { randomBytes } from "crypto";
import { createUser, initUser, initUserSolPubkey } from "../lib/lib";
import { AudiusData } from "../target/types/audius_data";

const { PublicKey } = anchor.web3;

const EthWeb3 = new ethWeb3();
const DefaultPubkey = new PublicKey("11111111111111111111111111111111");

export const initTestConstants = () => {
  const privKey = getRandomPrivateKey();
  const pkString = Buffer.from(privKey).toString("hex");
  const pubKey = EthWeb3.eth.accounts.privateKeyToAccount(pkString);
  const testEthAddr = pubKey.address;
  const testEthAddrBytes = ethAddressToArray(testEthAddr);
  const handle = randomBytes(20).toString("hex");
  const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle));
  // TODO: Verify this
  const handleBytesArray = Array.from({ ...handleBytes, length: 16 });
  const metadata = randomCID();
  const values = {
    privKey,
    pkString,
    pubKey,
    testEthAddr,
    testEthAddrBytes,
    handle,
    handleBytes,
    handleBytesArray,
    metadata,
  };
  return values;
};

export const testInitUser = async ({
  provider,
  program,
  baseAuthorityAccount,
  testEthAddr,
  testEthAddrBytes,
  handleBytesArray,
  bumpSeed,
  metadata,
  userStgAccount,
  adminStgKeypair,
  adminKeypair,
}) => {
  let tx = await initUser({
    provider,
    program,
    testEthAddrBytes: Array.from(testEthAddrBytes),
    handleBytesArray,
    bumpSeed,
    metadata,
    userStgAccount,
    baseAuthorityAccount,
    adminStgKey: adminStgKeypair.publicKey,
    adminKeypair,
  });
  const userDataFromChain = await program.account.user.fetch(userStgAccount);
  const returnedHex = EthWeb3.utils.bytesToHex(userDataFromChain.ethAddress);
  const returnedSolFromChain = userDataFromChain.authority;
  if (testEthAddr.toLowerCase() != returnedHex) {
    throw new Error(
      `Invalid eth address - expected ${testEthAddr.toLowerCase()}, found ${returnedHex}`
    );
  }
  if (!DefaultPubkey.equals(returnedSolFromChain)) {
    throw new Error(`Unexpected public key found`);
  }
  await confirmLogInTransaction(provider, tx, metadata);
};

export const testInitUserSolPubkey = async ({
  provider,
  program,
  message,
  pkString,
  newUserKeypair,
  newUserAcctPDA,
}) => {
  let initUserTx = await initUserSolPubkey({
    provider,
    program,
    privateKey: pkString,
    message,
    userSolPubkey: newUserKeypair.publicKey,
    userStgAccount: newUserAcctPDA,
  });

  let userDataFromChain = await program.account.user.fetch(newUserAcctPDA);
  if (!newUserKeypair.publicKey.equals(userDataFromChain.authority)) {
    throw new Error("Unexpected public key found");
  }
  let txInfo = await getTransaction(provider, initUserTx);
  let fee = txInfo["meta"]["fee"];
};

export const testCreateUser = async ({
  provider,
  program,
  message,
  pkString,
  baseAuthorityAccount,
  testEthAddr,
  testEthAddrBytes,
  handleBytesArray,
  bumpSeed,
  metadata,
  newUserKeypair,
  userStgAccount,
  adminStgPublicKey,
}) => {
  let tx = await createUser({
    provider,
    program,
    privateKey: pkString,
    message,
    testEthAddrBytes: Array.from(testEthAddrBytes),
    handleBytesArray,
    bumpSeed,
    metadata,
    userSolPubkey: newUserKeypair.publicKey,
    userStgAccount,
    adminStgPublicKey,
    baseAuthorityAccount,
  });
  const userDataFromChain = await program.account.user.fetch(userStgAccount);
  const returnedHex = EthWeb3.utils.bytesToHex(userDataFromChain.ethAddress);
  const returnedSolFromChain = userDataFromChain.authority;
  if (testEthAddr.toLowerCase() != returnedHex) {
    throw new Error(
      `Invalid eth address - expected ${testEthAddr.toLowerCase()}, found ${returnedHex}`
    );
  }
  if (!newUserKeypair.publicKey.equals(returnedSolFromChain)) {
    throw new Error("Unexpected public key found");
  }
  await confirmLogInTransaction(provider, tx, metadata);
};

export const confirmLogInTransaction = async (
  provider: anchor.Provider,
  tx: string,
  log: string
) => {
  let info = await getTransaction(provider, tx);
  let logs = info.meta.logMessages;
  let stringFound = false;
  logs.forEach((v) => {
    if (v.indexOf(log) > 0) {
      stringFound = true;
    }
  });
  if (!stringFound) {
    console.log(logs);
    throw new Error(`Failed to find ${log} in tx=${tx}`);
  }
  return info;
};
