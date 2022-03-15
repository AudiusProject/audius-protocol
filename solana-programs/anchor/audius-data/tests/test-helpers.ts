import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import Web3 from "web3";
import { Account } from "web3-core";
import { randomBytes } from "crypto";
import { expect } from "chai";
import {
  findDerivedPair,
  decodeInstruction,
  getTransaction,
  randomCID,
  getTransactionWithData,
} from "../lib/utils";
import {
  createUser,
  createTrack,
  createPlaylist,
  initUser,
  initUserSolPubkey,
  deleteTrack,
  updateTrack,
  EntityTypesEnumValues,
  ManagementActions,
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

  const info = await getTransaction(provider, tx);
  const data = info.transaction.message.instructions[0].data;
  const accountIndexes = info.transaction.message.instructions[0].accounts;
  const accountKeys = info.transaction.message.accountKeys;
  const decodedInstruction = decodeInstruction(program, data);
  const accountPubKeys = [];
  for (const i of accountIndexes) {
    accountPubKeys.push(accountKeys[i].toString());
  }
  const decodedData = decodedInstruction.data;
  expect(decodedInstruction.name).to.equal("initUser");
  expect(decodedData.metadata).to.equal(metadata);
};

export const testInitUserSolPubkey = async ({
  provider,
  program,
  message,
  ethPrivateKey,
  newUserPublicKey,
  newUserAcctPDA,
}) => {
  await initUserSolPubkey({
    provider,
    program,
    ethPrivateKey,
    message,
    userSolPubkey: newUserPublicKey,
    userStgAccount: newUserAcctPDA,
  });

  const account = await program.account.user.fetch(newUserAcctPDA);

  const chainAuthority = account.authority.toString();
  const expectedAuthority = newUserPublicKey.toString();
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

export const testCreateTrack = async ({
  provider,
  program,
  id,
  baseAuthorityAccount,
  handleBytesArray,
  bumpSeed,
  adminStgAccount,
  trackMetadata,
  userAuthorityKeypair,
  trackOwnerPDA,
}) => {
  const tx = await createTrack({
    id,
    program,
    userAuthorityKeypair,
    userStgAccountPDA: trackOwnerPDA,
    metadata: trackMetadata,
    baseAuthorityAccount,
    handleBytesArray,
    adminStgAccount,
    bumpSeed,
  });
  const { decodedInstruction, decodedData, accountPubKeys } =
    await getTransactionWithData(program, provider, tx);
  // Validate instruction data
  expect(decodedInstruction.name).to.equal("manageEntity");
  expect(decodedData.id).to.equal(id);
  expect(decodedData.metadata).to.equal(trackMetadata);
  expect(decodedData.entityType).to.deep.equal(EntityTypesEnumValues.track);
  expect(decodedData.managementAction).to.deep.equal(ManagementActions.create);
  // Assert on instruction struct
  // 1st index = track owner user storage account
  // 2nd index = user authority keypair
  // Indexing code must check that the track owner PDA is known before processing
  expect(accountPubKeys[1]).to.equal(trackOwnerPDA.toString());
  expect(accountPubKeys[2]).to.equal(userAuthorityKeypair.publicKey.toString());
};

export const testDeleteTrack = async ({
  provider,
  program,
  id,
  trackOwnerPDA,
  userAuthorityKeypair,
  baseAuthorityAccount,
  handleBytesArray,
  bumpSeed,
  adminStgAccount,
}) => {
  const tx = await deleteTrack({
    id,
    provider,
    program,
    userStgAccountPDA: trackOwnerPDA,
    userAuthorityKeypair: userAuthorityKeypair,
    baseAuthorityAccount,
    handleBytesArray,
    bumpSeed,
    adminStgAccount,
  });
  const { decodedInstruction, decodedData, accountPubKeys } =
    await getTransactionWithData(program, provider, tx);
  expect(decodedInstruction.name).to.equal("manageEntity");
  expect(decodedData.id).to.equal(id);
  expect(decodedData.entityType).to.deep.equal(EntityTypesEnumValues.track);
  expect(decodedData.managementAction).to.deep.equal(ManagementActions.delete);
  // Assert on instruction struct
  // 0th index = track owner user storage account
  // 1st index = user authority keypair
  // Indexing code must check that the track owner PDA is known before processing
  expect(accountPubKeys[1]).to.equal(trackOwnerPDA.toString());
  expect(accountPubKeys[2]).to.equal(userAuthorityKeypair.publicKey.toString());
};

export const testUpdateTrack = async ({
  provider,
  program,
  id,
  userStgAccountPDA,
  metadata,
  userAuthorityKeypair,
  baseAuthorityAccount,
  handleBytesArray,
  bumpSeed,
  adminStgAccount,
}) => {
  const tx = await updateTrack({
    program,
    baseAuthorityAccount,
    handleBytesArray,
    bumpSeed,
    adminStgAccount,
    id,
    userStgAccountPDA,
    metadata,
    userAuthorityKeypair,
  });
  const { decodedInstruction, decodedData, accountPubKeys } =
    await getTransactionWithData(program, provider, tx);

  // Validate instruction data
  expect(decodedInstruction.name).to.equal("manageEntity");
  expect(decodedData.id).to.equal(id);
  expect(decodedData.metadata).to.equal(metadata);
  expect(decodedData.entityType).to.deep.equal(EntityTypesEnumValues.track);
  expect(decodedData.managementAction).to.deep.equal(ManagementActions.update);
  // Assert on instruction struct
  // 0th index = track owner user storage account
  // 1st index = user authority keypair
  // Indexing code must check that the track owner PDA is known before processing
  expect(accountPubKeys[1]).to.equal(userStgAccountPDA.toString());
  expect(accountPubKeys[2]).to.equal(userAuthorityKeypair.publicKey.toString());
};

export const pollAccountBalance = async (
  provider: anchor.Provider,
  targetAccount: anchor.web3.PublicKey,
  targetBalance: number,
  maxRetries: number
) => {
  let currentBalance = await provider.connection.getBalance(targetAccount);
  let numRetries = 0;
  while (currentBalance > targetBalance && numRetries < maxRetries) {
    currentBalance = await provider.connection.getBalance(targetAccount);
    numRetries--;
  }
  if (currentBalance > targetBalance) {
    throw new Error(
      `Account ${targetAccount} failed to reach target balance ${targetBalance} in ${maxRetries} retries. Current balance = ${currentBalance}`
    );
  }
};

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
