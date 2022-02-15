import * as anchor from "@project-serum/anchor";
import ethWeb3 from "web3";
import { randomBytes } from "crypto";
import { expect } from "chai";
import { getTransaction, randomCID } from "../lib/utils";
import { createUser, initUser, initUserSolPubkey } from "../lib/lib";

const { PublicKey } = anchor.web3;

const EthWeb3 = new ethWeb3();
const DefaultPubkey = new PublicKey("11111111111111111111111111111111");

export const initTestConstants = () => {
  const ethAccount = EthWeb3.eth.accounts.create();
  const handle = randomBytes(20).toString("hex");
  const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle));
  const handleBytesArray = Array.from({ ...handleBytes, length: 16 }); // TODO: Verify this
  const metadata = randomCID();

  return {
    ethAccount,
    handle,
    handleBytes,
    handleBytesArray,
    metadata,
  };
};

export const testInitUser = async ({
  provider,
  program,
  baseAuthorityAccount,
  ethAddress,
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
    ethAddress,
    handleBytesArray,
    bumpSeed,
    metadata,
    userStgAccount,
    baseAuthorityAccount,
    adminStgKey: adminStgKeypair.publicKey,
    adminKeypair,
  });

  const account = await program.account.user.fetch(userStgAccount);

  const chainEthAddress = EthWeb3.utils.bytesToHex(account.ethAddress);
  expect(chainEthAddress, "eth address").to.equal(ethAddress.toLowerCase());

  const chainAuthority = account.authority.toString();
  const expectedAuthority = DefaultPubkey.toString();
  expect(chainAuthority, "authority").to.equal(expectedAuthority);

  await confirmLogInTransaction(provider, tx, metadata);
};

export const testInitUserSolPubkey = async ({
  provider,
  program,
  message,
  ethPrivateKey,
  newUserKeypair,
  newUserAcctPDA,
}) => {
  await initUserSolPubkey({
    provider,
    program,
    ethPrivateKey,
    message,
    userSolPubkey: newUserKeypair.publicKey,
    userStgAccount: newUserAcctPDA,
  });

  const account = await program.account.user.fetch(newUserAcctPDA);

  const chainAuthority = account.authority.toString();
  const expectedAuthority = newUserKeypair.publicKey.toString();
  expect(chainAuthority, "authority").to.equal(expectedAuthority);
};

export const testCreateUser = async ({
  provider,
  program,
  message,
  baseAuthorityAccount,
  ethAccount,
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
    ethAccount,
    message,
    handleBytesArray,
    bumpSeed,
    metadata,
    userSolPubkey: newUserKeypair.publicKey,
    userStgAccount,
    adminStgPublicKey,
    baseAuthorityAccount,
  });

  const account = await program.account.user.fetch(userStgAccount);

  const chainEthAddress = EthWeb3.utils.bytesToHex(account.ethAddress);
  expect(chainEthAddress, "eth address").to.equal(ethAccount.address.toLowerCase());

  const chainAuthority = account.authority.toString();
  const expectedAuthority = newUserKeypair.publicKey.toString();
  expect(chainAuthority, "authority").to.equal(expectedAuthority);

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
