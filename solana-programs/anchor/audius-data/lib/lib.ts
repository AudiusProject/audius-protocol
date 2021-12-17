/**
 * Library of typescript functions used in tests/CLI
 * Intended for later integration with libs
 */
import { Keypair } from "@solana/web3.js";
import { Program, Provider} from "@project-serum/anchor";
import { AudiusData } from "../target/types/audius_data";
import * as anchor from "@project-serum/anchor";
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;

type initAdminParams = {
  provider: Provider;
  program: Program<AudiusData>;
  adminKeypair: Keypair;
  adminStgKeypair: Keypair;
};

/// Initialize an Audius Admin instance
export const initAdmin = async (args: initAdminParams) => {
  const tx = await args.program.rpc.initAdmin(args.adminKeypair.publicKey, {
    accounts: {
      admin: args.adminStgKeypair.publicKey,
      payer: args.provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [args.adminStgKeypair],
  });
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
