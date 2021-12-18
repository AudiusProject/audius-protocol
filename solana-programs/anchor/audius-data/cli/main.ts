import { Program, Provider, Wallet, web3 } from "@project-serum/anchor";
import ethWeb3 from "web3";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AudiusData } from "../target/types/audius_data";
import * as anchor from "@project-serum/anchor";
const { SystemProgram, Transaction, Secp256k1Program } = anchor.web3;
import {
  getTransaction,
  getRandomPrivateKey,
  ethAddressToArray,
  randomCID,
  findDerivedPair,
} from "../lib/utils";
import {
  initUserSolPubkeyArgs,
  initAdmin,
  initUser,
  initUserSolPubkey,
} from "../lib/lib";

import { Command } from "commander";
const program = new Command();

const EthWeb3 = new ethWeb3();

const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/audius_data.json", "utf8")
);

const opts: web3.ConfirmOptions = {
  preflightCommitment: "confirmed",
};

const keypairFromFilePath = (path: string) => {
  return Keypair.fromSecretKey(Uint8Array.from(require(path)));
};

/// Initialize constants requird for any CLI functionality
function initializeCLI(ownerKeypairPath: string) {
  const network = "https://api.testnet.solana.com";
  const connection = new Connection(network, opts.preflightCommitment);
  const ownerKeypair = keypairFromFilePath(ownerKeypairPath);
  const wallet = new Wallet(ownerKeypair);
  const provider = new Provider(connection, wallet, opts);
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program<AudiusData>(idl, programID, provider);
  return {
    network,
    connection,
    ownerKeypair,
    wallet,
    provider,
    programID,
    program,
  };
}

type initAdminCLIParams = {
  adminKeypair: Keypair;
  adminStgKeypair: Keypair;
  ownerKeypairPath: string;
};

async function initAdminCLI(args: initAdminCLIParams) {
  const { adminKeypair, adminStgKeypair, ownerKeypairPath } = args;
  const cliVars = await initializeCLI(ownerKeypairPath);
  console.log(`AdminKeypair:`);
  console.log(adminKeypair.publicKey.toString());
  console.log(`[${adminKeypair.secretKey.toString()}]`);
  console.log(
    `echo "[${adminKeypair.secretKey.toString()}]" > adminKeypair.json`
  );
  console.log(`AdminStgKeypair:`);
  console.log(adminStgKeypair.publicKey.toString());
  console.log(`[${adminStgKeypair.secretKey.toString()}]`);
  console.log(
    `echo "[${adminKeypair.secretKey.toString()}]" > adminStgKeypair.json`
  );
  await initAdmin({
    provider: cliVars.provider,
    program: cliVars.program,
    adminKeypair,
    adminStgKeypair,
  });
}

type initUserCLIParams = {
  handle: string;
  metadata: string;
  adminStgPublicKey: PublicKey;
  ethAddress: string;
  ownerKeypairPath: string;
  adminKeypair: Keypair;
};
async function initUserCLI(args: initUserCLIParams) {
  const {
    adminKeypair,
    handle,
    ethAddress,
    ownerKeypairPath,
    metadata,
    adminStgPublicKey,
  } = args;
  const cliVars = await initializeCLI(ownerKeypairPath);
  const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle));
  const handleBytesArray = Array.from({ ...handleBytes, length: 16 });
  const ethAddressBytes = ethAddressToArray(ethAddress);
  const { baseAuthorityAccount, bumpSeed, derivedAddress } =
    await findDerivedPair(
      cliVars.program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

  const userStgAddress = derivedAddress;
  let tx = await initUser({
    provider: cliVars.provider,
    program: cliVars.program,
    testEthAddrBytes: Array.from(ethAddressBytes),
    handleBytesArray,
    bumpSeed,
    metadata,
    userStgAccount: userStgAddress,
    baseAuthorityAccount,
    adminStgKey: adminStgPublicKey,
    adminKeypair,
  });
  console.log(
    `Initialized user=${handle}, tx=${tx}, userAcct=${userStgAddress}`
  );
}

const functionTypes = Object.freeze({
  initAdmin: "initAdmin",
  initUser: "initUser",
  initUserSolPubkey: "initUserSolPubkey",
});

program
  .option("-f, --function <type>", "function to invoke")
  .option("-k, --owner-keypair <keypair>", "owner keypair path")
  .option("-ak, --admin-keypair <keypair>", "admin keypair path")
  .option("-ask, --admin-storage-keypair <keypair>", "admin stg keypair path")
  .option("-h, --handle <string>", "user handle string")
  .option("-e, --eth-address <string>", "user eth address")
  .option("-u, --user-solana-keypair <string>", "user admin sol keypair path")
  .option(
    "-ustg, --user-stg-pubkey <string>",
    "user sol handle-based PDA pubkey"
  )
  .option(
    "-eth-pk, --eth-private-key <string>",
    "private key for message signing"
  );

program.parse(process.argv);

const options = program.opts();

// Conditionally load keys if provided
// Admin key used to control accounts
const adminKeypair = options.adminKeypair
  ? keypairFromFilePath(options.adminKeypair)
  : anchor.web3.Keypair.generate();

// Admin stg keypair, referenced internally
// Keypair technically only necessary the first time this is initialized
const adminStgKeypair = options.adminStorageKeypair
  ? keypairFromFilePath(options.adminStorageKeypair)
  : anchor.web3.Keypair.generate();

switch (options.function) {
  case functionTypes.initAdmin:
    console.log(`Initializing admin`);
    initAdminCLI({
      ownerKeypairPath: options.ownerKeypair,
      adminKeypair: adminKeypair,
      adminStgKeypair: adminStgKeypair,
    });
    break;
  case functionTypes.initUser:
    console.log(`Initializing user`);
    console.log(options);
    initUserCLI({
      ownerKeypairPath: options.ownerKeypair,
      ethAddress: options.ethAddress,
      handle: options.handle,
      adminStgPublicKey: adminStgKeypair.publicKey,
      adminKeypair,
      metadata: "test",
    });
  case functionTypes.initUserSolPubkey:
    const userSolKeypair = options.userSolanaKeypair
      ? keypairFromFilePath(options.userSolanaKeypair)
      : anchor.web3.Keypair.generate();

    console.log(userSolKeypair.publicKey.toString());
    let privateKey = options.ethPrivateKey;
    let userSolPubkey = userSolKeypair.publicKey;
    let userStgAccount = options.userStgPubkey;
    console.log(userStgAccount);
    let x = async () => {
      const cliVars = initializeCLI(options.ownerKeypair);
      console.log("hi");
      let tx = await initUserSolPubkey({
        program: cliVars.program,
        provider: cliVars.provider,
        message: "message",
        privateKey,
        userStgAccount,
        userSolPubkey,
      });
      console.log(`initUserTx = ${tx}, userStgAccount = ${userStgAccount}`);
    };
    x();
}
