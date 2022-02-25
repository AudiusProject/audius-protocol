/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { Account } from "web3-core";
import * as secp256k1 from "secp256k1";
import { AudiusData } from "../target/types/audius_data";
import { signBytes, SystemSysVarProgramKey } from "./utils";
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;

/// Initialize an Audius Admin instance
type initAdminParams = {
  provider: Provider;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStgKeypair: Keypair;
  trackIdOffset: anchor.BN;
  playlistIdOffset: anchor.BN;
};

export const initAdmin = async ({
  provider,
  program,
  adminKeypair,
  adminStgKeypair,
  trackIdOffset,
  playlistIdOffset,
}: initAdminParams) => {
  return program.rpc.initAdmin(
    adminKeypair.publicKey,
    trackIdOffset,
    playlistIdOffset,
    {
      accounts: {
        admin: adminStgKeypair.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [adminStgKeypair],
    }
  );
};

/// Initialize a user from the Audius Admin account
type initUserParams = {
  provider: Provider;
  program: Program<AudiusData>;
  ethAddress: string;
  handleBytesArray: number[];
  bumpSeed: number;
  metadata: string;
  userStgAccount: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStgKey: anchor.web3.PublicKey;
  adminKeypair: anchor.web3.Keypair;
};

export const initUser = async ({
  provider,
  program,
  ethAddress,
  handleBytesArray,
  bumpSeed,
  metadata,
  userStgAccount,
  baseAuthorityAccount,
  adminStgKey,
  adminKeypair,
}: initUserParams) => {
  return program.rpc.initUser(
    baseAuthorityAccount,
    anchor.utils.bytes.hex.decode(ethAddress),
    handleBytesArray,
    bumpSeed,
    metadata,
    {
      accounts: {
        admin: adminStgKey,
        payer: provider.wallet.publicKey,
        user: userStgAccount,
        authority: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [adminKeypair],
    }
  );
};

/// Claim a user's account using given an eth private key
export type initUserSolPubkeyArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  ethPrivateKey: string;
  message: string;
  userSolPubkey: anchor.web3.PublicKey;
  userStgAccount: anchor.web3.PublicKey;
};

export const initUserSolPubkey = async ({
  provider,
  program,
  ethPrivateKey,
  message,
  userSolPubkey,
  userStgAccount,
}: initUserSolPubkeyArgs) => {
  const { signature, recoveryId } = signBytes(
    Buffer.from(message),
    ethPrivateKey
  );

  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(anchor.utils.bytes.hex.decode(ethPrivateKey), false)
    .slice(1);

  const tx = new Transaction();

  tx.add(Secp256k1Program.createInstructionWithPublicKey({
    publicKey: ethPubkey,
    message: Buffer.from(message),
    signature,
    recoveryId,
  }));

  tx.add(program.instruction.initUserSol(
    userSolPubkey,
    {
      accounts: {
        user: userStgAccount,
        sysvarProgram: SystemSysVarProgramKey,
      },
    },
  ));

  return provider.send(tx);
};

/// Create a user without Audius Admin account
type createUserParams = {
  provider: Provider;
  program: Program<AudiusData>;
  ethAccount: Account;
  message: string;
  handleBytesArray: number[];
  bumpSeed: number;
  metadata: string;
  userSolPubkey: anchor.web3.PublicKey;
  userStgAccount: anchor.web3.PublicKey;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
};

export const createUser = async ({
  baseAuthorityAccount,
  program,
  ethAccount,
  message,
  handleBytesArray,
  bumpSeed,
  metadata,
  provider,
  userSolPubkey,
  userStgAccount,
  adminStgPublicKey,
}: createUserParams) => {
  const { signature, recoveryId } = signBytes(
    Buffer.from(message),
    ethAccount.privateKey
  );

  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(anchor.utils.bytes.hex.decode(ethAccount.privateKey), false)
    .slice(1);

  const tx = new Transaction();

  tx.add(Secp256k1Program.createInstructionWithPublicKey({
    publicKey: ethPubkey,
    message: Buffer.from(message),
    signature,
    recoveryId,
  }));

  tx.add(program.instruction.createUser(
    baseAuthorityAccount,
    anchor.utils.bytes.hex.decode(ethAccount.address),
    handleBytesArray,
    bumpSeed,
    metadata,
    userSolPubkey,
    {
      accounts: {
        payer: provider.wallet.publicKey,
        user: userStgAccount,
        systemProgram: SystemProgram.programId,
        sysvarProgram: SystemSysVarProgramKey,
        audiusAdmin: adminStgPublicKey,
      },
    },
  ));

  return provider.send(tx);
};

/// Initialize a user from the Audius Admin account
type updateUserParams = {
  program: Program<AudiusData>;
  metadata: string;
  userStgAccount: anchor.web3.PublicKey;
  userAuthorityKeypair: anchor.web3.Keypair;
};

export const updateUser = async ({
  program,
  metadata,
  userStgAccount,
  userAuthorityKeypair,
}: updateUserParams) => {
  return program.rpc.updateUser(
    metadata,
    {
      accounts: {
        user: userStgAccount,
        userAuthority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

// Update Audius Admin account
type updateAdminParams = {
  program: Program<AudiusData>;
  isWriteEnabled: boolean;
  adminStgAccount: anchor.web3.PublicKey;
  adminAuthorityKeypair: anchor.web3.Keypair;
};

export const updateAdmin = async ({
  program,
  isWriteEnabled,
  adminStgAccount,
  adminAuthorityKeypair,
}: updateAdminParams) => {
  return program.rpc.updateAdmin(
    isWriteEnabled,
    {
      accounts: {
        admin: adminStgAccount,
        adminAuthority: adminAuthorityKeypair.publicKey,
      },
      signers: [adminAuthorityKeypair],
    },
  );
};

/// Create a track
export type createTrackArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  newTrackKeypair: Keypair;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
  adminStgPublicKey: anchor.web3.PublicKey;
  metadata: string;
};

export const createTrack = async ({
  provider,
  program,
  newTrackKeypair,
  userAuthorityKeypair,
  userStgAccountPDA,
  adminStgPublicKey,
  metadata,
}: createTrackArgs) => {
  return program.rpc.createTrack(metadata, {
    accounts: {
      track: newTrackKeypair.publicKey,
      user: userStgAccountPDA,
      authority: userAuthorityKeypair.publicKey,
      payer: provider.wallet.publicKey,
      audiusAdmin: adminStgPublicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [userAuthorityKeypair, newTrackKeypair],
  });
};

/// Initialize a user from the Audius Admin account
type updateTrackParams = {
  program: Program<AudiusData>;
  trackPDA: anchor.web3.PublicKey;
  metadata: string;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
};

export const updateTrack = async ({
  program,
  trackPDA,
  metadata,
  userAuthorityKeypair,
  userStgAccountPDA,
}: updateTrackParams) => {
  return program.rpc.updateTrack(
    metadata,
    {
      accounts: {
        track: trackPDA,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Initialize a user from the Audius Admin account
type deleteTrackParams = {
  provider: Provider;
  program: Program<AudiusData>;
  trackPDA: Keypair;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
};

export const deleteTrack = async ({
  provider,
  program,
  trackPDA,
  userStgAccountPDA,
  userAuthorityKeypair,
}: deleteTrackParams) => {
  return program.rpc.deleteTrack({
    accounts: {
      track: trackPDA,
      user: userStgAccountPDA,
      authority: userAuthorityKeypair.publicKey,
      payer: provider.wallet.publicKey,
    },
    signers: [userAuthorityKeypair],
  });
};

/// Create a playlist
export type createPlaylistArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  newPlaylistKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
  userAuthorityKeypair: Keypair;
  adminStgPublicKey: anchor.web3.PublicKey;
  metadata: string;
};

export const createPlaylist = async ({
  provider,
  program,
  newPlaylistKeypair,
  userStgAccountPDA,
  userAuthorityKeypair,
  adminStgPublicKey,
  metadata,
}: createPlaylistArgs) => {
  return program.rpc.createPlaylist(metadata, {
    accounts: {
      playlist: newPlaylistKeypair.publicKey,
      user: userStgAccountPDA,
      authority: userAuthorityKeypair.publicKey,
      audiusAdmin: adminStgPublicKey,
      payer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [newPlaylistKeypair, userAuthorityKeypair],
  });
};

/// Update a playlist
export type updatePlaylistArgs = {
  program: Program<AudiusData>;
  playlistPublicKey: anchor.web3.PublicKey;
  userStgAccountPDA: anchor.web3.PublicKey;
  userAuthorityKeypair: Keypair;
  metadata: string;
};

export const updatePlaylist = async ({
  program,
  playlistPublicKey,
  userStgAccountPDA,
  userAuthorityKeypair,
  metadata,
}: updatePlaylistArgs) => {
  return program.rpc.updatePlaylist(metadata, {
    accounts: {
      playlist: playlistPublicKey,
      user: userStgAccountPDA,
      authority: userAuthorityKeypair.publicKey,
    },
    signers: [userAuthorityKeypair],
  });
};

/// Delete a playlist
export type deletePlaylistArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  playlistPublicKey: anchor.web3.PublicKey;
  userStgAccountPDA: anchor.web3.PublicKey;
  userAuthorityKeypair: Keypair;
};

export const deletePlaylist = async ({
  provider,
  program,
  playlistPublicKey,
  userStgAccountPDA,
  userAuthorityKeypair,
}: deletePlaylistArgs) => {
  return program.rpc.deletePlaylist({
    accounts: {
      playlist: playlistPublicKey,
      user: userStgAccountPDA,
      authority: userAuthorityKeypair.publicKey,
      payer: provider.wallet.publicKey,
    },
    signers: [userAuthorityKeypair],
  });
};
