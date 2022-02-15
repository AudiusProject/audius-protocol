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

export const initAdmin = async (args: initAdminParams) => {
  return args.program.rpc.initAdmin(
    args.adminKeypair.publicKey,
    args.trackIdOffset,
    args.playlistIdOffset,
    {
      accounts: {
        admin: args.adminStgKeypair.publicKey,
        payer: args.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [args.adminStgKeypair],
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

export const initUser = async (args: initUserParams) => {
  const {
    baseAuthorityAccount,
    program,
    ethAddress,
    handleBytesArray,
    bumpSeed,
    metadata,
    provider,
    adminStgKey,
    userStgAccount,
    adminKeypair,
  } = args;

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

export const initUserSolPubkey = async (args: initUserSolPubkeyArgs) => {
  const {
    message,
    ethPrivateKey,
    provider,
    program,
    userSolPubkey,
    userStgAccount,
  } = args;
  const signedBytes = signBytes(Buffer.from(message), ethPrivateKey);
  const { signature, recoveryId } = signedBytes;
  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(anchor.utils.bytes.hex.decode(ethPrivateKey), false)
    .slice(1);

  const tx = new Transaction();

  tx.add(Secp256k1Program.createInstructionWithPublicKey({
    publicKey: Buffer.from(ethPubkey),
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

  return provider.send(tx, [ /* Signers */ ]);
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

export const createUser = async (args: createUserParams) => {
  const {
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
  } = args;

  const signedBytes = signBytes(Buffer.from(message), ethAccount.privateKey);

  const { signature, recoveryId } = signedBytes;

  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(anchor.utils.bytes.hex.decode(ethAccount.privateKey), false)
    .slice(1);

  const tx = new Transaction();

  tx.add(Secp256k1Program.createInstructionWithPublicKey({
    publicKey: Buffer.from(ethPubkey),
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

  return provider.send(tx, [ /* Signers */ ]);
};

/// Initialize a user from the Audius Admin account
type updateUserParams = {
  program: Program<AudiusData>;
  metadata: string;
  userStgAccount: anchor.web3.PublicKey;
  userAuthorityKeypair: anchor.web3.Keypair;
};

export const updateUser = async (args: updateUserParams) => {
  const {
    program,
    metadata,
    userStgAccount,
    userAuthorityKeypair,
  } = args;

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

export const createTrack = async (args: createTrackArgs) => {
  const {
    provider,
    program,
    newTrackKeypair,
    userAuthorityKeypair,
    metadata,
    userStgAccountPDA,
    adminStgPublicKey,
  } = args;

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

export const updateTrack = async (args: updateTrackParams) => {
  const {
    program,
    trackPDA,
    metadata,
    userStgAccountPDA,
    userAuthorityKeypair,
  } = args;

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

export const deleteTrack = async (args: deleteTrackParams) => {
  const {
    provider,
    program,
    trackPDA,
    userStgAccountPDA,
    userAuthorityKeypair,
  } = args;

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

export const createPlaylist = async (args: createPlaylistArgs) => {
  const {
    provider,
    program,
    newPlaylistKeypair,
    userStgAccountPDA,
    userAuthorityKeypair,
    adminStgPublicKey,
    metadata,
  } = args;

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

export const updatePlaylist = async (args: updatePlaylistArgs) => {
  const {
    program,
    playlistPublicKey,
    userStgAccountPDA,
    userAuthorityKeypair,
    metadata,
  } = args;

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

export const deletePlaylist = async (args: deletePlaylistArgs) => {
  const {
    provider,
    program,
    playlistPublicKey,
    userStgAccountPDA,
    userAuthorityKeypair,
  } = args;

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
