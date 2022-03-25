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

export const EntityTypesEnumValues = {
  track: { track: {} },
  playlist: { playlist: {} },
};

export const ManagementActions = {
  create: { create: {} },
  update: { update: {} },
  delete: { delete: {} },
};

export const EntitySocialActions = {
  addSave: { addSave: {} },
  deleteSave: { deleteSave: {} },
  addRepost: { addRepost: {} },
  deleteRepost: { deleteRepost: {} },
};

type InitAdminParams = {
  provider: Provider;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStgKeypair: Keypair;
  verifierKeypair: Keypair;
};

type InitUserParams = {
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
  replicaSet: number[];
  replicaSetBumps: number[];
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
};

type CreateUserParams = {
  provider: Provider;
  program: Program<AudiusData>;
  ethAccount: Account;
  message: Uint8Array;
  userId: anchor.BN;
  handleBytesArray: number[];
  bumpSeed: number;
  metadata: string;
  userSolPubkey: anchor.web3.PublicKey;
  userStgAccount: anchor.web3.PublicKey;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  replicaSet: number[];
  replicaSetBumps: number[];
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
};

type UpdateUserParams = {
  program: Program<AudiusData>;
  metadata: string;
  userStgAccount: anchor.web3.PublicKey;
  userAuthorityDelegate: anchor.web3.PublicKey;
  authorityDelegationStatusAccount: anchor.web3.PublicKey;
  userAuthorityKeypair: anchor.web3.Keypair;
};

type UpdateAdminParams = {
  program: Program<AudiusData>;
  isWriteEnabled: boolean;
  adminStgAccount: anchor.web3.PublicKey;
  adminAuthorityKeypair: anchor.web3.Keypair;
};

type UpdateIsVerifiedParams = {
  program: Program<AudiusData>;
  userStgAccount: anchor.web3.PublicKey;
  verifierKeypair: anchor.web3.Keypair;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminKeypair: Keypair;
  handleBytesArray: number[];
  bumpSeed: number;
};

type InitUserSolPubkeyParams = {
  provider: Provider;
  program: Program<AudiusData>;
  ethPrivateKey: string;
  message: Uint8Array;
  userSolPubkey: anchor.web3.PublicKey;
  userStgAccount: anchor.web3.PublicKey;
};

type UpdateEntityParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStgAccount: anchor.web3.PublicKey;
  handleBytesArray: number[];
  bumpSeed: number;
  metadata: string;
  id: anchor.BN;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
};

type CreateEntityParams = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStgAccount: anchor.web3.PublicKey;
  handleBytesArray: number[];
  bumpSeed: number;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
  metadata: string;
  id: anchor.BN;
};

type DeleteEntityParams = {
  provider: Provider;
  program: Program<AudiusData>;
  id: anchor.BN;
  userAuthorityKeypair: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  adminStgAccount: anchor.web3.PublicKey;
  handleBytesArray: number[];
  bumpSeed: number;
};

/// Create a content node with the audius admin authority
type CreateContentNode = {
  provider: Provider;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  contentNodeAcct: anchor.web3.PublicKey;
  contentNodeAuthority: anchor.web3.PublicKey;
  spID: anchor.BN;
  ownerEthAddress: string;
};

/// Verify user with authenticatorKeypair
type UpdateUserReplicaSet = {
  provider: Provider;
  program: Program<AudiusData>;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  replicaSet: number[];
  replicaSetBumps: number[];
  contentNodeAuthority: anchor.web3.Keypair;
  cn1: anchor.web3.PublicKey;
  cn2: anchor.web3.PublicKey;
  cn3: anchor.web3.PublicKey;
  userAcct: anchor.web3.PublicKey;
  userHandle: { seed: number[]; bump: number };
}; 

export const EntitySocialActionEnumValues = {
  addSave: { addSave: {} },
  deleteSave: { deleteSave: {} },
  addRepost: { addRepost: {} },
  deleteRepost: { deleteRepost: {} },
};

type EntitySocialActionArgs = {
  program: Program<AudiusData>;
  baseAuthorityAccount: anchor.web3.PublicKey;
  userStgAccountPDA: anchor.web3.PublicKey;
  userAuthorityKeypair: Keypair;
  adminStgPublicKey: anchor.web3.PublicKey;
  handleBytesArray: number[];
  bumpSeed: number;
  id: string;
};

type Proposer = {
  pda: anchor.web3.PublicKey;
  authority: anchor.web3.Keypair;
  seedBump: { seed: Buffer; bump: number };
};

/// Create or update a content node with proposers
type PublicCreateOrUpdateContentNode = {
  provider: Provider;
  program: Program<AudiusData>;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  contentNodeAcct: anchor.web3.PublicKey;
  contentNodeAuthority: anchor.web3.PublicKey;
  spID: anchor.BN;
  ownerEthAddress: string;
  proposer1: Proposer;
  proposer2: Proposer;
  proposer3: Proposer;
};

type PublicUpdateContentNode = {
  provider: Provider;
  program: Program<AudiusData>;
  adminStgPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  contentNodeAcct: anchor.web3.PublicKey;
  contentNodeAuthority: anchor.web3.PublicKey;
  cn: Proposer;
  proposer1: Proposer;
  proposer2: Proposer;
  proposer3: Proposer;
};

/// Create a content node with proposers
type PublicDeleteContentNode = {
  provider: Provider;
  program: Program<AudiusData>;
  adminStgPublicKey: anchor.web3.PublicKey;
  adminAuthorityPublicKey: anchor.web3.PublicKey;
  baseAuthorityAccount: anchor.web3.PublicKey;
  cnDelete: Proposer;
  proposer1: Proposer;
  proposer2: Proposer;
  proposer3: Proposer;
};

/// Initialize an Audius Admin instance
export const initAdmin = async ({
  provider,
  program,
  adminKeypair,
  adminStgKeypair,
  verifierKeypair,
}: InitAdminParams) => {
  return program.rpc.initAdmin(
    adminKeypair.publicKey,
    verifierKeypair.publicKey,
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
export const initUser = async ({
  provider,
  program,
  ethAddress,
  handleBytesArray,
  bumpSeed,
  replicaSet,
  replicaSetBumps,
  metadata,
  userStgAccount,
  baseAuthorityAccount,
  adminStgKey,
  adminKeypair,
  cn1,
  cn2,
  cn3,
}: InitUserParams) => {
  return program.rpc.initUser(
    baseAuthorityAccount,
    [...anchor.utils.bytes.hex.decode(ethAddress)],
    replicaSet,
    replicaSetBumps,
    handleBytesArray,
    bumpSeed,
    metadata,
    {
      accounts: {
        admin: adminStgKey,
        payer: provider.wallet.publicKey,
        user: userStgAccount,
        cn1,
        cn2,
        cn3,
        authority: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [adminKeypair],
    }
  );
};

/// Claim a user's account using given an eth private key
export const initUserSolPubkey = async ({
  provider,
  program,
  ethPrivateKey,
  message,
  userSolPubkey,
  userStgAccount,
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
        user: userStgAccount,
        sysvarProgram: SystemSysVarProgramKey,
      },
    })
  );

  return provider.send(tx);
};

export const createContentNode = async ({
  provider,
  program,
  adminStgPublicKey,
  adminKeypair,
  baseAuthorityAccount,
  spID,
  contentNodeAuthority,
  contentNodeAcct,
  ownerEthAddress,
}: CreateContentNode) => {
  return program.rpc.createContentNode(
    baseAuthorityAccount,
    spID.toNumber(),
    contentNodeAuthority,
    [...anchor.utils.bytes.hex.decode(ownerEthAddress)],
    {
      accounts: {
        admin: adminStgPublicKey,
        payer: provider.wallet.publicKey,
        contentNode: contentNodeAcct,
        authority: adminKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [adminKeypair],
    }
  );
};

export const updateUserReplicaSet = async ({
  provider,
  program,
  adminStgPublicKey,
  baseAuthorityAccount,
  replicaSet,
  userAcct,
  replicaSetBumps,
  userHandle,
  contentNodeAuthority,
  cn1,
  cn2,
  cn3,
}: UpdateUserReplicaSet) => {
  return program.rpc.updateUserReplicaSet(
    baseAuthorityAccount,
    userHandle,
    replicaSet,
    replicaSetBumps,
    {
      accounts: {
        admin: adminStgPublicKey,
        user: userAcct,
        cnAuthority: contentNodeAuthority.publicKey,
        cn1,
        cn2,
        cn3,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [contentNodeAuthority],
    }
  );
};

export const publicCreateOrUpdateContentNode = async ({
  provider,
  program,
  adminStgPublicKey,
  baseAuthorityAccount,
  spID,
  contentNodeAcct,
  ownerEthAddress,
  contentNodeAuthority,
  proposer1,
  proposer2,
  proposer3,
}: PublicCreateOrUpdateContentNode) => {
  return program.rpc.publicCreateOrUpdateContentNode(
    baseAuthorityAccount,
    { seed: [...proposer1.seedBump.seed], bump: proposer1.seedBump.bump },
    { seed: [...proposer2.seedBump.seed], bump: proposer2.seedBump.bump },
    { seed: [...proposer3.seedBump.seed], bump: proposer3.seedBump.bump },
    spID.toNumber(),
    contentNodeAuthority,
    [...anchor.utils.bytes.hex.decode(ownerEthAddress)],
    {
      accounts: {
        admin: adminStgPublicKey,
        payer: provider.wallet.publicKey,
        contentNode: contentNodeAcct,
        systemProgram: SystemProgram.programId,
        proposer1: proposer1.pda,
        proposer1Authority: proposer1.authority.publicKey,
        proposer2: proposer2.pda,
        proposer2Authority: proposer2.authority.publicKey,
        proposer3: proposer3.pda,
        proposer3Authority: proposer3.authority.publicKey,
      },
      signers: [proposer1.authority, proposer2.authority, proposer3.authority],
    }
  );
};

/// Update a content node with proposers
export const publicUpdateContentNode = async ({
  provider,
  program,
  adminStgPublicKey,
  baseAuthorityAccount,
  contentNodeAcct,
  contentNodeAuthority,
  cn,
  proposer1,
  proposer2,
  proposer3,
}: PublicUpdateContentNode) => {
  return program.rpc.publicUpdateContentNode(
    baseAuthorityAccount,
    { seed: [...cn.seedBump.seed], bump: cn.seedBump.bump },
    { seed: [...proposer1.seedBump.seed], bump: proposer1.seedBump.bump },
    { seed: [...proposer2.seedBump.seed], bump: proposer2.seedBump.bump },
    { seed: [...proposer3.seedBump.seed], bump: proposer3.seedBump.bump },
    contentNodeAuthority,
    {
      accounts: {
        admin: adminStgPublicKey,
        payer: provider.wallet.publicKey,
        contentNode: contentNodeAcct,
        systemProgram: SystemProgram.programId,
        proposer1: proposer1.pda,
        proposer1Authority: proposer1.authority.publicKey,
        proposer2: proposer2.pda,
        proposer2Authority: proposer2.authority.publicKey,
        proposer3: proposer3.pda,
        proposer3Authority: proposer3.authority.publicKey,
      },
      signers: [proposer1.authority, proposer2.authority, proposer3.authority],
    }
  );
};

export const publicDeleteContentNode = async ({
  provider,
  program,
  adminStgPublicKey,
  adminAuthorityPublicKey,
  baseAuthorityAccount,
  cnDelete,
  proposer1,
  proposer2,
  proposer3,
}: PublicDeleteContentNode) => {
  return program.rpc.publicDeleteContentNode(
    baseAuthorityAccount,
    { seed: [...cnDelete.seedBump.seed], bump: cnDelete.seedBump.bump },
    { seed: [...proposer1.seedBump.seed], bump: proposer1.seedBump.bump },
    { seed: [...proposer2.seedBump.seed], bump: proposer2.seedBump.bump },
    { seed: [...proposer3.seedBump.seed], bump: proposer3.seedBump.bump },
    {
      accounts: {
        admin: adminStgPublicKey,
        adminAuthority: adminAuthorityPublicKey,
        payer: provider.wallet.publicKey,
        contentNode: cnDelete.pda,
        systemProgram: SystemProgram.programId,
        proposer1: proposer1.pda,
        proposer1Authority: proposer1.authority.publicKey,
        proposer2: proposer2.pda,
        proposer2Authority: proposer2.authority.publicKey,
        proposer3: proposer3.pda,
        proposer3Authority: proposer3.authority.publicKey,
      },
      signers: [proposer1.authority, proposer2.authority, proposer3.authority],
    }
  );
};

/// Create a user without Audius Admin account
export const createUser = async ({
  baseAuthorityAccount,
  program,
  ethAccount,
  message,
  replicaSet,
  replicaSetBumps,
  handleBytesArray,
  cn1,
  cn2,
  cn3,
  userId,
  bumpSeed,
  metadata,
  provider,
  userSolPubkey,
  userStgAccount,
  adminStgPublicKey,
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
      handleBytesArray,
      bumpSeed,
      metadata,
      userId,
      userSolPubkey,
      {
        accounts: {
          payer: provider.wallet.publicKey,
          user: userStgAccount,
          cn1,
          cn2,
          cn3,
          systemProgram: SystemProgram.programId,
          sysvarProgram: SystemSysVarProgramKey,
          audiusAdmin: adminStgPublicKey,
        },
      }
    )
  );

  return provider.send(tx);
};

/// Initialize a user from the Audius Admin account

export const updateUser = async ({
  program,
  metadata,
  userStgAccount,
  userAuthorityKeypair,
  userAuthorityDelegate,
  authorityDelegationStatusAccount,
}: UpdateUserParams) => {
  return program.rpc.updateUser(metadata, {
    accounts: {
      user: userStgAccount,
      userAuthority: userAuthorityKeypair.publicKey,
      userAuthorityDelegate,
      authorityDelegationStatus: authorityDelegationStatusAccount,
    },
    signers: [userAuthorityKeypair],
  });
};

/// Update Audius Admin account

export const updateAdmin = async ({
  program,
  isWriteEnabled,
  adminStgAccount,
  adminAuthorityKeypair,
}: UpdateAdminParams) => {
  return program.rpc.updateAdmin(isWriteEnabled, {
    accounts: {
      admin: adminStgAccount,
      adminAuthority: adminAuthorityKeypair.publicKey,
    },
    signers: [adminAuthorityKeypair],
  });
};

/// Verify user with authenticatorKeypair

export const updateIsVerified = async ({
  program,
  adminKeypair,
  userStgAccount,
  verifierKeypair,
  baseAuthorityAccount,
  handleBytesArray,
  bumpSeed,
}: UpdateIsVerifiedParams) => {
  return program.rpc.updateIsVerified(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    {
      accounts: {
        user: userStgAccount,
        audiusAdmin: adminKeypair.publicKey,
        verifier: verifierKeypair.publicKey,
      },
      signers: [verifierKeypair],
    }
  );
};

/// Create a track
export const createTrack = async ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityKeypair,
  userStgAccountPDA,
  metadata,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: CreateEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.track,
    ManagementActions.create,
    id,
    metadata,
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Initialize a user from the Audius Admin account

export const updateTrack = async ({
  program,
  baseAuthorityAccount,
  id,
  metadata,
  userAuthorityKeypair,
  userStgAccountPDA,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: UpdateEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.track,
    ManagementActions.update,
    id,
    metadata,
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Initialize a user from the Audius Admin account

export const deleteTrack = async ({
  program,
  id,
  userStgAccountPDA,
  userAuthorityKeypair,
  baseAuthorityAccount,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: DeleteEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.track,
    ManagementActions.delete,
    id,
    "",
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Create a playlist

export const createPlaylist = async ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityKeypair,
  userStgAccountPDA,
  metadata,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: CreateEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.playlist,
    ManagementActions.create,
    id,
    metadata,
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Update a playlist

export const updatePlaylist = async ({
  id,
  program,
  baseAuthorityAccount,
  userAuthorityKeypair,
  userStgAccountPDA,
  metadata,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: UpdateEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.playlist,
    ManagementActions.update,
    id,
    metadata,
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Delete a playlist
export const deletePlaylist = async ({
  program,
  id,
  userStgAccountPDA,
  userAuthorityKeypair,
  baseAuthorityAccount,
  handleBytesArray,
  adminStgAccount,
  bumpSeed,
}: DeleteEntityParams) => {
  return program.rpc.manageEntity(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntityTypesEnumValues.playlist,
    ManagementActions.delete,
    id,
    "",
    {
      accounts: {
        audiusAdmin: adminStgAccount,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

/// Get keypair from secret key
export const getKeypairFromSecretKey = async (secretKey: Uint8Array) => {
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
};

/// Social actions
export const addTrackSave = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.addSave,
    EntityTypesEnumValues.track,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const deleteTrackSave = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.deleteSave,
    EntityTypesEnumValues.track,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const addTrackRepost = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.addRepost,
    EntityTypesEnumValues.track,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const deleteTrackRepost = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.deleteRepost,
    EntityTypesEnumValues.track,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const addPlaylistSave = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.addSave,
    EntityTypesEnumValues.playlist,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const deletePlaylistSave = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.deleteSave,
    EntityTypesEnumValues.playlist,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const addPlaylistRepost = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.addRepost,
    EntityTypesEnumValues.playlist,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};

export const deletePlaylistRepost = async ({
  program,
  baseAuthorityAccount,
  userStgAccountPDA,
  userAuthorityKeypair,
  handleBytesArray,
  bumpSeed,
  adminStgPublicKey,
  id,
}: EntitySocialActionArgs) => {
  return program.rpc.writeEntitySocialAction(
    baseAuthorityAccount,
    { seed: handleBytesArray, bump: bumpSeed },
    EntitySocialActions.deleteRepost,
    EntityTypesEnumValues.playlist,
    id,
    {
      accounts: {
        audiusAdmin: adminStgPublicKey,
        user: userStgAccountPDA,
        authority: userAuthorityKeypair.publicKey,
      },
      signers: [userAuthorityKeypair],
    }
  );
};
