import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import Web3 from "web3";
import { Account } from "web3-core";
import { randomBytes } from "crypto";
import { expect } from "chai";
import { findDerivedPair, getTransaction, randomCID } from "../lib/utils";
import {
  createUser,
  createTrack,
  createPlaylist,
  initUser,
  initUserSolPubkey,
} from "../lib/lib";
import { AudiusData } from "../target/types/audius_data";

const { PublicKey } = anchor.web3;

const EthWeb3 = new Web3();
const DefaultPubkey = new PublicKey("11111111111111111111111111111111");

type InitTestConsts = {
  ethAccount: Account;
  handle: string;
  handleBytes: Buffer;
  handleBytesArray: number[];
  metadata: string;
};

export const initTestConstants = (): InitTestConsts => {
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
  const tx = await initUser({
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
  const tx = await createUser({
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
  expect(chainEthAddress, "eth address").to.equal(
    ethAccount.address.toLowerCase()
  );

  const chainAuthority = account.authority.toString();
  const expectedAuthority = newUserKeypair.publicKey.toString();
  expect(chainAuthority, "authority").to.equal(expectedAuthority);

  await confirmLogInTransaction(provider, tx, metadata);
};

export const pollAccountBalance = async (
  provider: anchor.Provider,
  targetAccount: anchor.web3.PublicKey,
  targetBalance: Number,
  maxRetries: Number
) => {
  let currentBalance = await provider.connection.getBalance(targetAccount)
  let numRetries = 0
  while (currentBalance > targetBalance && numRetries < maxRetries) {
    currentBalance = await provider.connection.getBalance(targetAccount)
  }
  if (currentBalance > targetBalance) {
    throw new Error(`Account ${targetAccount} failed to reach target balance ${targetBalance} in ${maxRetries} retries. Current balance = ${currentBalance}`)
  }
}

export const confirmLogInTransaction = async (
  provider: anchor.Provider,
  tx: string,
  log: string
) => {
  const info = await getTransaction(provider, tx);
  const logs = info.meta.logMessages;
  let stringFound = false;
  logs.forEach((v) => {
    if (v.indexOf(log) !== -1) {
      stringFound = true;
    }
  });
  if (!stringFound) {
    console.log(logs);
    throw new Error(`Failed to find ${log} in tx=${tx}`);
  }
  return info;
};

export const createSolanaUser = async (
  program: Program<AudiusData>,
  provider: anchor.Provider,
  adminStgKeypair: anchor.web3.Keypair
) => {
  const testConsts = initTestConstants();

  const {
    baseAuthorityAccount,
    bumpSeed,
    derivedAddress: newUserAcctPDA,
  } = await findDerivedPair(
    program.programId,
    adminStgKeypair.publicKey,
    Buffer.from(testConsts.handleBytesArray)
  );

  // New sol key that will be used to permission user updates
  const newUserKeypair = anchor.web3.Keypair.generate();

  // Generate signed SECP instruction
  // Message as the incoming public key
  const message = newUserKeypair.publicKey.toBytes();

  await createUser({
    provider,
    program,
    ethAccount: testConsts.ethAccount,
    handleBytesArray: testConsts.handleBytesArray,
    message,
    bumpSeed,
    metadata: testConsts.metadata,
    userSolPubkey: newUserKeypair.publicKey,
    userStgAccount: newUserAcctPDA,
    adminStgPublicKey: adminStgKeypair.publicKey,
    baseAuthorityAccount,
  });

  const account = await program.account.user.fetch(newUserAcctPDA);

  return {
    account,
    pda: newUserAcctPDA,
    handleBytesArray: testConsts.handleBytesArray,
    bumpSeed,
    keypair: newUserKeypair,
    authority: baseAuthorityAccount,
  };
};

export const createSolanaTrack = async (
  program: Program<AudiusData>,
  provider: anchor.Provider,
  adminStgKeypair: anchor.web3.Keypair,
  userAuthorityKeypair: anchor.web3.Keypair,
  ownerPDA: anchor.web3.PublicKey
) => {
  const newTrackKeypair = anchor.web3.Keypair.generate();
  const trackMetadata = randomCID();

  await createTrack({
    provider,
    program,
    newTrackKeypair,
    userAuthorityKeypair,
    userStgAccountPDA: ownerPDA,
    metadata: trackMetadata,
    adminStgPublicKey: adminStgKeypair.publicKey,
  });

  const track = await program.account.track.fetch(newTrackKeypair.publicKey);

  if (!track) {
    throw new Error("unable to create track account");
  }

  return {
    track,
    trackMetadata: trackMetadata,
  };
};

export const createSolanaPlaylist = async (
  program: Program<AudiusData>,
  provider: anchor.Provider,
  adminStgKeypair: anchor.web3.Keypair,
  userAuthorityKeypair: anchor.web3.Keypair,
  ownerPDA: anchor.web3.PublicKey
) => {
  const newPlaylistKeypair = anchor.web3.Keypair.generate();
  const playlistMetadata = randomCID();

  await createPlaylist({
    provider,
    program,
    newPlaylistKeypair,
    userAuthorityKeypair,
    userStgAccountPDA: ownerPDA,
    metadata: playlistMetadata,
    adminStgPublicKey: adminStgKeypair.publicKey,
  });

  const playlist = await program.account.playlist.fetch(
    newPlaylistKeypair.publicKey
  );

  if (!playlist) {
    throw new Error("unable to create playlist account");
  }

  return {
    playlist,
    playlistkMetadata: playlistMetadata,
  };
};
