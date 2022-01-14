/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */
import { Keypair } from "@solana/web3.js";
import { Program, Provider } from "@project-serum/anchor";
import { AudiusData } from "../target/types/audius_data";
import * as anchor from "@project-serum/anchor";
import * as secp256k1 from "secp256k1";
import { signBytes, SystemSysVarProgramKey } from "./utils";
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;

type initAdminParams = {
  provider: Provider;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStgKeypair: Keypair;
  trackIdOffset: anchor.BN;
};

/// Initialize an Audius Admin instance
export const initAdmin = async (args: initAdminParams) => {
  const tx = await args.program.rpc.initAdmin(
    args.adminKeypair.publicKey,
    args.trackIdOffset,
    {
      accounts: {
        admin: args.adminStgKeypair.publicKey,
        payer: args.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [args.adminStgKeypair],
    }
  );
  console.log(`initAdmin Tx = ${tx}`);
  let adminAccount = await args.program.account.audiusAdmin.fetch(
    args.adminStgKeypair.publicKey
  );
  console.log(`Admin: ${args.adminKeypair.publicKey.toString()}`);
  console.log(`AdminStg ${args.adminStgKeypair.publicKey.toString()}`);
  console.log(`AdminAccount (from Chain) ${adminAccount.authority.toString()}`);
  return tx;
};

/// Initialize a user from the Audius Admin account
type initUserParams = {
  provider: Provider;
  program: Program<AudiusData>;
  testEthAddrBytes: number[];
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
    testEthAddrBytes,
    handleBytesArray,
    bumpSeed,
    metadata,
    provider,
    adminStgKey,
    userStgAccount,
    adminKeypair,
  } = args;

  let tx = await program.rpc.initUser(
    baseAuthorityAccount,
    Array.from(testEthAddrBytes),
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

  return tx;
};

/// Claim a user's account using given an eth private key
export type initUserSolPubkeyArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  privateKey: string;
  message: string;
  userSolPubkey: anchor.web3.PublicKey;
  userStgAccount: anchor.web3.PublicKey;
};

export const initUserSolPubkey = async (args: initUserSolPubkeyArgs) => {
  const {
    message,
    privateKey,
    provider,
    program,
    userSolPubkey,
    userStgAccount,
  } = args;
  const signedBytes = signBytes(Buffer.from(message), privateKey);
  const { signature, recoveryId } = signedBytes;
  console.log(privateKey);
  console.log(userStgAccount);
  // Get the public key in a compressed format
  const ethPubkey = secp256k1
    .publicKeyCreate(Buffer.from(privateKey, "hex"), false)
    .slice(1);
  const secpTransactionInstruction =
    Secp256k1Program.createInstructionWithPublicKey({
      publicKey: Buffer.from(ethPubkey),
      message: Buffer.from(message),
      signature,
      recoveryId,
    });
  let initUserTx = await provider.send(
    (() => {
      const tx = new Transaction();
      tx.add(secpTransactionInstruction),
        tx.add(
          program.instruction.initUserSol(userSolPubkey, {
            accounts: {
              user: userStgAccount,
              sysvarProgram: SystemSysVarProgramKey,
            },
          })
        );
      return tx;
    })(),
    [
      // Signers
    ]
  );
  return initUserTx;
};

/// Create a track
export type createTrackArgs = {
  provider: Provider;
  program: Program<AudiusData>;
  newTrackKeypair: Keypair;
  userAuthorityKey: Keypair;
  userStgAccountPDA: anchor.web3.PublicKey;
  adminStgPublicKey: anchor.web3.PublicKey;
  metadata: string;
};
export const createTrack = async (args: createTrackArgs) => {
  const {
    provider,
    program,
    newTrackKeypair,
    userAuthorityKey,
    metadata,
    userStgAccountPDA,
    adminStgPublicKey,
  } = args;
  let tx = await program.rpc.createTrack(metadata, {
    accounts: {
      track: newTrackKeypair.publicKey,
      user: userStgAccountPDA,
      authority: userAuthorityKey.publicKey,
      payer: provider.wallet.publicKey,
      audiusAdmin: adminStgPublicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [userAuthorityKey, newTrackKeypair],
  });
  return tx;
};
