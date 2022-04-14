/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { Account } from "web3-core";
import * as secp256k1 from "secp256k1";
import { AudiusData } from "../target/types/audius_data";
import { signBytes, SystemSysVarProgramKey } from "./utils";
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;

/**
 * Audius Admin
 */

export type InitAdminParams = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStorageKeypair: Keypair;
  verifierKeypair: Keypair;
};

/// Initialize an Audius Admin instance
export const initAdmin = ({
  payer,
  program,
  adminKeypair,
  adminStorageKeypair,
  verifierKeypair,
}: InitAdminParams) => {
  const tx = new Transaction();

  tx.add(
    program.instruction.initAdmin(
      adminKeypair.publicKey,
      verifierKeypair.publicKey,
      {
        accounts: {
          admin: adminStorageKeypair.publicKey,
          payer,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

export type Proposer = {
  pda: anchor.web3.PublicKey;
  authorityPublicKey: anchor.web3.PublicKey;
  seedBump: { seed: Buffer; bump: number };
};

// Initialize a user from the Audius Admin account.
// No ID param because every user being 'initialized' from Admin already has an ID.
export type InitUserParams = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  ethAddress: string;
  userId: anchor.BN;
  bumpSeed: number;
  metadata: string;
  userStorageAccount: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStorageAccount: anchor.web3.PublicKey;
  adminAuthorityPublicKey: anchor.web3.PublicKey;
  replicaSet: number[];
  replicaSetBumps: number[];
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
};

/// Initialize a user from the Audius Admin account
/// No ID param because every user being 'initialized' from Admin already has an ID
export const initUser = ({
  payer,
  program,
  ethAddress,
  userId,
  bumpSeed,
  replicaSet,
  replicaSetBumps,
  metadata,
  userStorageAccount,
  baseAuthorityAccount,
  adminStorageAccount,
  adminAuthorityPublicKey,
  cn1,
  cn2,
  cn3,
}: InitUserParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.initUser(
      baseAuthorityAccount,
      [...anchor.utils.bytes.hex.decode(ethAddress)],
      replicaSet,
      replicaSetBumps,
      userId.toNumber(),
      bumpSeed,
      metadata,
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccount,
          cn1,
          cn2,
          cn3,
          authority: adminAuthorityPublicKey,
          payer,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

export type InitUserSolPubkeyParams = {
  program: Program<AudiusData>;
  ethPrivateKey: string;
  message: Uint8Array;
  userSolPubkey: anchor.web3.PublicKey;
  userStorageAccount: anchor.web3.PublicKey;
};

/// Claim a user's account using given an eth private key
export const initUserSolPubkey = ({
  program,
  ethPrivateKey,
  message,
  userSolPubkey,
  userStorageAccount,
}: InitUserSolPubkeyParams) => {
  const { signature, recoveryId } = signBytes(message, ethPrivateKey);

  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(anchor.utils.bytes.hex.decode(ethPrivateKey), false)
    .slice(1);

  const tx = new Transaction();

  tx.add(
    Secp256k1Program.createInstructionWithPublicKey({
      publicKey: ethPubkey,
      message: message,
      recoveryId: recoveryId,
      signature: signature,
    })
  );

  tx.add(
    program.instruction.initUserSol(userSolPubkey, {
      accounts: {
        user: userStorageAccount,
        sysvarProgram: SystemSysVarProgramKey,
      },
    })
  );
  return tx;
};

/// Create a content node with the audius admin authority
export type CreateContentNode = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  adminPublicKey: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  contentNodeAcct: anchor.web3.PublicKey;
  contentNodeAuthority: anchor.web3.PublicKey;
  spID: anchor.BN;
  ownerEthAddress: string;
};

export const createContentNode = ({
  payer,
  program,
  adminStoragePublicKey,
  adminPublicKey,
  baseAuthorityAccount,
  spID,
  contentNodeAuthority,
  contentNodeAcct,
  ownerEthAddress,
}: CreateContentNode) => {
  const tx = new Transaction();

  tx.add(
    program.instruction.createContentNode(
      baseAuthorityAccount,
      spID.toNumber(),
      contentNodeAuthority,
      [...anchor.utils.bytes.hex.decode(ownerEthAddress)],
      {
        accounts: {
          admin: adminStoragePublicKey,
          payer,
          contentNode: contentNodeAcct,
          authority: adminPublicKey,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

/// Verify user with authenticatorKeypair
export type UpdateUserReplicaSet = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  adminStoragePublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  replicaSet: number[];
  replicaSetBumps: number[];
  contentNodeAuthorityPublicKey: anchor.web3.PublicKey;
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
  userAcct: anchor.web3.PublicKey;
  userIdSeedBump: { userId: number; bump: number };
};

export const updateUserReplicaSet = ({
  payer,
  program,
  adminStoragePublicKey,
  baseAuthorityAccount,
  replicaSet,
  userAcct,
  replicaSetBumps,
  userIdSeedBump,
  contentNodeAuthorityPublicKey,
  cn1,
  cn2,
  cn3,
}: UpdateUserReplicaSet) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.updateUserReplicaSet(
      baseAuthorityAccount,
      userIdSeedBump,
      replicaSet,
      replicaSetBumps,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userAcct,
          cnAuthority: contentNodeAuthorityPublicKey,
          cn1,
          cn2,
          cn3,
          payer,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

/// Create or update a content node with proposers
export type PublicCreateOrUpdateContentNode = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  adminStoragePublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  contentNodeAcct: anchor.web3.PublicKey;
  contentNodeAuthority: anchor.web3.PublicKey;
  spID: anchor.BN;
  ownerEthAddress: string;
  proposer1: Proposer;
  proposer2: Proposer;
  proposer3: Proposer;
};

export const publicCreateOrUpdateContentNode = ({
  payer,
  program,
  adminStoragePublicKey,
  baseAuthorityAccount,
  spID,
  contentNodeAcct,
  ownerEthAddress,
  contentNodeAuthority,
  proposer1,
  proposer2,
  proposer3,
}: PublicCreateOrUpdateContentNode) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.publicCreateOrUpdateContentNode(
      baseAuthorityAccount,
      { seed: [...proposer1.seedBump.seed], bump: proposer1.seedBump.bump },
      { seed: [...proposer2.seedBump.seed], bump: proposer2.seedBump.bump },
      { seed: [...proposer3.seedBump.seed], bump: proposer3.seedBump.bump },
      spID.toNumber(),
      contentNodeAuthority,
      [...anchor.utils.bytes.hex.decode(ownerEthAddress)],
      {
        accounts: {
          admin: adminStoragePublicKey,
          payer,
          contentNode: contentNodeAcct,
          systemProgram: SystemProgram.programId,
          proposer1: proposer1.pda,
          proposer1Authority: proposer1.authorityPublicKey,
          proposer2: proposer2.pda,
          proposer2Authority: proposer2.authorityPublicKey,
          proposer3: proposer3.pda,
          proposer3Authority: proposer3.authorityPublicKey,
        },
      }
    )
  );
  return tx;
};

/// Create a content node with proposers
export type PublicDeleteContentNode = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  adminStoragePublicKey: anchor.web3.PublicKey;
  adminAuthorityPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  cnDelete: Proposer;
  proposer1: Proposer;
  proposer2: Proposer;
  proposer3: Proposer;
};

export const publicDeleteContentNode = ({
  payer,
  program,
  adminStoragePublicKey,
  adminAuthorityPublicKey,
  baseAuthorityAccount,
  cnDelete,
  proposer1,
  proposer2,
  proposer3,
}: PublicDeleteContentNode) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.publicDeleteContentNode(
      baseAuthorityAccount,
      { seed: [...cnDelete.seedBump.seed], bump: cnDelete.seedBump.bump },
      { seed: [...proposer1.seedBump.seed], bump: proposer1.seedBump.bump },
      { seed: [...proposer2.seedBump.seed], bump: proposer2.seedBump.bump },
      { seed: [...proposer3.seedBump.seed], bump: proposer3.seedBump.bump },
      {
        accounts: {
          admin: adminStoragePublicKey,
          adminAuthority: adminAuthorityPublicKey,
          payer,
          contentNode: cnDelete.pda,
          systemProgram: SystemProgram.programId,
          proposer1: proposer1.pda,
          proposer1Authority: proposer1.authorityPublicKey,
          proposer2: proposer2.pda,
          proposer2Authority: proposer2.authorityPublicKey,
          proposer3: proposer3.pda,
          proposer3Authority: proposer3.authorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export type CreateUserParams = {
  payer: anchor.web3.PublicKey;
  program: Program<AudiusData>;
  ethAccount: Account;
  message: Uint8Array;
  userId: anchor.BN;
  bumpSeed: number;
  metadata: string;
  userSolPubkey: anchor.web3.PublicKey;
  userStorageAccount: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  replicaSet: number[];
  replicaSetBumps: number[];
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
};
/// Create a user without Audius Admin account
export const createUser = ({
  baseAuthorityAccount,
  program,
  ethAccount,
  message,
  replicaSet,
  replicaSetBumps,
  cn1,
  cn2,
  cn3,
  userId,
  bumpSeed,
  metadata,
  payer,
  userSolPubkey,
  userStorageAccount,
  adminStoragePublicKey,
}: CreateUserParams) => {
  const { signature, recoveryId } = signBytes(message, ethAccount.privateKey);

  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(
      anchor.utils.bytes.hex.decode(ethAccount.privateKey),
      false
    )
    .slice(1);

  const tx = new Transaction();
  tx.add(
    Secp256k1Program.createInstructionWithPublicKey({
      publicKey: ethPubkey,
      message: message,
      signature,
      recoveryId,
    })
  );
  tx.add(
    program.instruction.createUser(
      baseAuthorityAccount,
      [...anchor.utils.bytes.hex.decode(ethAccount.address)],
      replicaSet,
      replicaSetBumps,
      userId.toNumber(),
      bumpSeed,
      metadata,
      userSolPubkey,
      {
        accounts: {
          payer,
          user: userStorageAccount,
          cn1,
          cn2,
          cn3,
          systemProgram: SystemProgram.programId,
          sysvarProgram: SystemSysVarProgramKey,
          admin: adminStoragePublicKey,
        },
      }
    )
  );

  return tx;
};

// Update a user's metadata.
export type UpdateUserParams = {
  program: Program<AudiusData>;
  metadata: string;
  userStorageAccount: anchor.web3.PublicKey;
  userAuthorityDelegate: anchor.web3.PublicKey;
  authorityDelegationStatusAccount: anchor.web3.PublicKey;
  userAuthorityPublicKey: anchor.web3.PublicKey;
};

export const updateUser = ({
  program,
  metadata,
  userStorageAccount,
  userAuthorityPublicKey,
  userAuthorityDelegate,
  authorityDelegationStatusAccount,
}: UpdateUserParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.updateUser(metadata, {
      accounts: {
        user: userStorageAccount,
        userAuthority: userAuthorityPublicKey,
        userAuthorityDelegate,
        authorityDelegationStatus: authorityDelegationStatusAccount,
      },
    })
  );
  return tx;
};

export type UpdateAdminParams = {
  program: Program<AudiusData>;
  isWriteEnabled: boolean;
  adminStorageAccount: anchor.web3.PublicKey;
  adminAuthorityKeypair: anchor.web3.Keypair;
};

export const updateAdmin = ({
  program,
  isWriteEnabled,
  adminStorageAccount,
  adminAuthorityKeypair,
}: UpdateAdminParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.updateAdmin(isWriteEnabled, {
      accounts: {
        admin: adminStorageAccount,
        adminAuthority: adminAuthorityKeypair.publicKey,
      },
      signers: [adminAuthorityKeypair],
    })
  );
  return tx;
};

/**
 * User delegation
 */

type InitAuthorityDelegationStatusParams = {
  program: Program<AudiusData>;
  authorityName: string;
  userAuthorityDelegatePublicKey: anchor.web3.PublicKey;
  authorityDelegationStatusPDA: anchor.web3.PublicKey;
  payer: anchor.web3.PublicKey;
};

export const initAuthorityDelegationStatus = ({
  program,
  authorityName,
  userAuthorityDelegatePublicKey,
  authorityDelegationStatusPDA,
  payer,
}: InitAuthorityDelegationStatusParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.initAuthorityDelegationStatus(authorityName, {
      accounts: {
        delegateAuthority: userAuthorityDelegatePublicKey,
        authorityDelegationStatusPda: authorityDelegationStatusPDA,
        payer,
        systemProgram: SystemProgram.programId,
      },
    })
  );
  return tx;
};

type RevokeAuthorityDelegationParams = {
  program: Program<AudiusData>;
  authorityDelegationBump: number;
  userAuthorityDelegatePublicKey: anchor.web3.PublicKey;
  authorityDelegationStatusPDA: anchor.web3.PublicKey;
  payer: anchor.web3.PublicKey;
};

export const revokeAuthorityDelegation = ({
  program,
  authorityDelegationBump,
  userAuthorityDelegatePublicKey,
  authorityDelegationStatusPDA,
  payer,
}: RevokeAuthorityDelegationParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.revokeAuthorityDelegation(authorityDelegationBump, {
      accounts: {
        delegateAuthority: userAuthorityDelegatePublicKey,
        authorityDelegationStatusPda: authorityDelegationStatusPDA,
        payer,
        systemProgram: SystemProgram.programId,
      },
    })
  );
  return tx;
};

type AddUserAuthorityDelegateParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  delegatePublicKey: anchor.web3.PublicKey;
  user: anchor.web3.PublicKey;
  currentUserAuthorityDelegate: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  userId: anchor.BN;
  userBumpSeed: number;
  signerUserAuthorityDelegate: anchor.web3.PublicKey;
  authorityDelegationStatus: anchor.web3.PublicKey;
  authorityPublicKey: anchor.web3.PublicKey;
  payer: anchor.web3.PublicKey;
};

export const addUserAuthorityDelegate = ({
  program,
  baseAuthorityAccount,
  delegatePublicKey,
  user,
  authorityDelegationStatus,
  currentUserAuthorityDelegate,
  userId,
  userBumpSeed,
  adminStoragePublicKey,
  signerUserAuthorityDelegate,
  authorityPublicKey,
  payer,
}: AddUserAuthorityDelegateParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.addUserAuthorityDelegate(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: userBumpSeed },
      delegatePublicKey,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user,
          currentUserAuthorityDelegate,
          signerUserAuthorityDelegate,
          authorityDelegationStatus,
          authority: authorityPublicKey,
          payer,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

type RemoveUserAuthorityDelegateParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  delegatePublicKey: anchor.web3.PublicKey;
  delegateBump: number;
  user: anchor.web3.PublicKey;
  currentUserAuthorityDelegate: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  userId: anchor.BN;
  userBumpSeed: number;
  signerUserAuthorityDelegate: anchor.web3.PublicKey;
  authorityDelegationStatus: anchor.web3.PublicKey;
  authorityPublicKey: anchor.web3.PublicKey;
  payer: anchor.web3.PublicKey;
};

export const removeUserAuthorityDelegate = ({
  program,
  baseAuthorityAccount,
  delegatePublicKey,
  delegateBump,
  user,
  authorityDelegationStatus,
  currentUserAuthorityDelegate,
  userId,
  userBumpSeed,
  adminStoragePublicKey,
  signerUserAuthorityDelegate,
  authorityPublicKey,
  payer,
}: RemoveUserAuthorityDelegateParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.removeUserAuthorityDelegate(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: userBumpSeed },
      delegatePublicKey,
      delegateBump,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user,
          currentUserAuthorityDelegate,
          signerUserAuthorityDelegate,
          authorityDelegationStatus,
          authority: authorityPublicKey,
          payer,
          systemProgram: SystemProgram.programId,
        },
      }
    )
  );
  return tx;
};

// Verify user with authenticatorKeypair.
export type UpdateIsVerifiedParams = {
  program: Program<AudiusData>;
  userStorageAccount: anchor.web3.PublicKey;
  verifierPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminPublicKey: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
};

/// Verify user with verifier Keypair
export const updateIsVerified = ({
  program,
  adminPublicKey,
  userStorageAccount,
  verifierPublicKey,
  baseAuthorityAccount,
  userId,
  bumpSeed,
}: UpdateIsVerifiedParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.updateIsVerified(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      {
        accounts: {
          user: userStorageAccount,
          admin: adminPublicKey,
          verifier: verifierPublicKey,
        },
      }
    )
  );
  return tx;
};

export type CreateEntityParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStorageAccount: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  userStorageAccountPDA: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
  metadata: string;
  id: anchor.BN;
};

export type DeleteEntityParams = {
  program: Program<AudiusData>;
  id: anchor.BN;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
  userStorageAccountPDA: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStorageAccount: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
};

export const createTrack = ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityPublicKey,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userStorageAccountPDA,
  metadata,
  userId,
  adminStorageAccount,
  bumpSeed,
}: CreateEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.track,
      ManagementActions.create,
      id,
      metadata,
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/// Initialize a user from the Audius Admin account
/**
 * Manage entity
 * actions: create, update, delete
 * entities: track, playlist
 */

export const EntityTypesEnumValues = {
  track: { track: {} },
  playlist: { playlist: {} },
};

export const ManagementActions = {
  create: { create: {} },
  update: { update: {} },
  delete: { delete: {} },
};

export type UpdateEntityParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStorageAccount: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
  metadata: string;
  id: anchor.BN;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  userStorageAccountPDA: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
};

export type EntitySocialActionArgs = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  userStorageAccountPDA: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
  id: string;
};

export const updateTrack = ({
  program,
  baseAuthorityAccount,
  id,
  metadata,
  userAuthorityPublicKey,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userId,
  adminStorageAccount,
  bumpSeed,
}: UpdateEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.track,
      ManagementActions.update,
      id,
      metadata,
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/// Initialize a user from the Audius Admin account

export const deleteTrack = ({
  program,
  id,
  userStorageAccountPDA,
  userAuthorityPublicKey,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  baseAuthorityAccount,
  userId,
  adminStorageAccount,
  bumpSeed,
}: DeleteEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.track,
      ManagementActions.delete,
      id,
      "",
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/// Create a playlist

export const createPlaylist = ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityPublicKey,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userStorageAccountPDA,
  metadata,
  userId,
  adminStorageAccount,
  bumpSeed,
}: CreateEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.playlist,
      ManagementActions.create,
      id,
      metadata,
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/// Update a playlist

export const updatePlaylist = ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityPublicKey,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userStorageAccountPDA,
  metadata,
  userId,
  adminStorageAccount,
  bumpSeed,
}: UpdateEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.playlist,
      ManagementActions.update,
      id,
      metadata,
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/// Delete a playlist
export const deletePlaylist = ({
  program,
  id,
  userStorageAccountPDA,
  userAuthorityPublicKey,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  baseAuthorityAccount,
  userId,
  adminStorageAccount,
  bumpSeed,
}: DeleteEntityParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.manageEntity(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntityTypesEnumValues.playlist,
      ManagementActions.delete,
      id,
      "",
      {
        accounts: {
          admin: adminStorageAccount,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

/**
 * Write entity social actions
 * actions: save, repost
 * entities: track, playlist
 */

export const EntitySocialActionEnumValues = {
  addSave: { addSave: {} },
  deleteSave: { deleteSave: {} },
  addRepost: { addRepost: {} },
  deleteRepost: { deleteRepost: {} },
};

export const EntitySocialActions = {
  addSave: { addSave: {} },
  deleteSave: { deleteSave: {} },
  addRepost: { addRepost: {} },
  deleteRepost: { deleteRepost: {} },
};

type EntitySocialActionParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  userStorageAccountPDA: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  userId: anchor.BN;
  bumpSeed: number;
  id: string;
};

/// Social actions
export const addTrackSave = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.addSave,
      EntityTypesEnumValues.track,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          authority: userAuthorityPublicKey,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
        },
      }
    )
  );
  return tx;
};

export const deleteTrackSave = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.deleteSave,
      EntityTypesEnumValues.track,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const addTrackRepost = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.addRepost,
      EntityTypesEnumValues.track,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const deleteTrackRepost = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.deleteRepost,
      EntityTypesEnumValues.track,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const addPlaylistSave = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.addSave,
      EntityTypesEnumValues.playlist,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const deletePlaylistSave = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.deleteSave,
      EntityTypesEnumValues.playlist,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const addPlaylistRepost = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.addRepost,
      EntityTypesEnumValues.playlist,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const deletePlaylistRepost = ({
  program,
  baseAuthorityAccount,
  userStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  userId,
  bumpSeed,
  adminStoragePublicKey,
  id,
}: EntitySocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeEntitySocialAction(
      baseAuthorityAccount,
      { userId: userId.toNumber(), bump: bumpSeed },
      EntitySocialActions.deleteRepost,
      EntityTypesEnumValues.playlist,
      id,
      {
        accounts: {
          admin: adminStoragePublicKey,
          user: userStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

/**
 * User social actions
 */
export const UserSocialActions = {
  followUser: { followUser: {} },
  unfollowUser: { unfollowUser: {} },
  subscribeUser: { subscribeUser: {} },
  unsubscribeUser: { unsubscribeUser: {} },
};

type UserSocialActionParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  sourceUserStorageAccountPDA: anchor.web3.PublicKey;
  targetUserStorageAccountPDA: anchor.web3.PublicKey;
  userAuthorityDelegateAccountPDA: anchor.web3.PublicKey;
  authorityDelegationStatusAccountPDA: anchor.web3.PublicKey;
  userAuthorityPublicKey: anchor.web3.PublicKey;
  adminStoragePublicKey: anchor.web3.PublicKey;
  sourceUserId: anchor.BN;
  sourceUserBumpSeed: number;
  targetUserId: anchor.BN;
  targetUserBumpSeed: number;
};

export const followUser = ({
  program,
  baseAuthorityAccount,
  sourceUserStorageAccountPDA,
  targetUserStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  sourceUserId,
  sourceUserBumpSeed,
  targetUserId,
  targetUserBumpSeed,
  adminStoragePublicKey,
}: UserSocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeUserSocialAction(
      baseAuthorityAccount,
      UserSocialActions.followUser,
      { userId: sourceUserId, bump: sourceUserBumpSeed },
      { userId: targetUserId, bump: targetUserBumpSeed },
      {
        accounts: {
          admin: adminStoragePublicKey,
          sourceUserStorage: sourceUserStorageAccountPDA,
          targetUserStorage: targetUserStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const unfollowUser = ({
  program,
  baseAuthorityAccount,
  sourceUserStorageAccountPDA,
  targetUserStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  sourceUserId,
  sourceUserBumpSeed,
  targetUserId,
  targetUserBumpSeed,
  adminStoragePublicKey,
}: UserSocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeUserSocialAction(
      baseAuthorityAccount,
      UserSocialActions.unfollowUser,
      { userId: sourceUserId, bump: sourceUserBumpSeed },
      { userId: targetUserId, bump: targetUserBumpSeed },
      {
        accounts: {
          admin: adminStoragePublicKey,
          sourceUserStorage: sourceUserStorageAccountPDA,
          targetUserStorage: targetUserStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const subscribeUser = ({
  program,
  baseAuthorityAccount,
  sourceUserStorageAccountPDA,
  targetUserStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  sourceUserId,
  sourceUserBumpSeed,
  targetUserId,
  targetUserBumpSeed,
  adminStoragePublicKey,
}: UserSocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeUserSocialAction(
      baseAuthorityAccount,
      UserSocialActions.subscribeUser,
      { userId: sourceUserId, bump: sourceUserBumpSeed },
      { userId: targetUserId, bump: targetUserBumpSeed },
      {
        accounts: {
          admin: adminStoragePublicKey,
          sourceUserStorage: sourceUserStorageAccountPDA,
          targetUserStorage: targetUserStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

export const unsubscribeUser = ({
  program,
  baseAuthorityAccount,
  sourceUserStorageAccountPDA,
  targetUserStorageAccountPDA,
  userAuthorityDelegateAccountPDA,
  authorityDelegationStatusAccountPDA,
  userAuthorityPublicKey,
  sourceUserId,
  sourceUserBumpSeed,
  targetUserId,
  targetUserBumpSeed,
  adminStoragePublicKey,
}: UserSocialActionParams) => {
  const tx = new Transaction();
  tx.add(
    program.instruction.writeUserSocialAction(
      baseAuthorityAccount,
      UserSocialActions.unsubscribeUser,
      { userId: sourceUserId, bump: sourceUserBumpSeed },
      { userId: targetUserId, bump: targetUserBumpSeed },
      {
        accounts: {
          admin: adminStoragePublicKey,
          sourceUserStorage: sourceUserStorageAccountPDA,
          targetUserStorage: targetUserStorageAccountPDA,
          userAuthorityDelegate: userAuthorityDelegateAccountPDA,
          authorityDelegationStatus: authorityDelegationStatusAccountPDA,
          authority: userAuthorityPublicKey,
        },
      }
    )
  );
  return tx;
};

/**
 * Helper functions
 */

export const getKeypairFromSecretKey = async (secretKey: Uint8Array) => {
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
};
