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
} from "../tests/utils";
import { initAdmin, initUser } from "../lib/lib";

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
async function initializeCLI(ownerKeypairPath: string) {
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
  console.log(adminKeypair.secretKey.toString());
  console.log(`AdminStgKeypair:`);
  console.log(adminStgKeypair.publicKey.toString());
  console.log(adminStgKeypair.secretKey.toString());
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
  console.log(userStgAddress);
  console.log(ethAddressBytes);
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
});

program
  .option("-f, --function <type>", "function to invoke")
  .option("-k, --owner-keypair <keypair>", "owner keypair path")
  .option("-ak, --admin-keypair <keypair>", "admin keypair path")
  .option("-ask, --admin-storage-keypair <keypair>", "admin stg keypair path")
  .option("-h, --handle <string>", "user handle string")
  .option("-e, --eth-address <string>", "user eth address");

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
}

// Airdrop to self
/*
solana airdrop 1 BTDNV9XQK65FUEwqmkGxokXdqZeKeETsyiHxE3SYGXbX --url https://api.testnet.solana.com
*/

/*

AdminKeypair:
4w8Th4vpdfKJbYQyMvvnDuPFriTfjfhwVGZsiLuGXzfE

AdminStgKeypair:
ERvpAkfDnd4KBa5rB67Tmyjvy9mbMHpVF5ouqSFrE45s

Address: 0x0a93d8cb0Be85B3Ea8f33FA63500D118deBc83F7
Private key: d540ca11a0d12345f512e65e00bf8bf87435aa40b3731cbf0322971709eba60f


*/

/*
Initializing a user from known admin accts:
yarn run ts-node cli/main.ts -f initUser -k ~/.config/solana/id.json --admin-keypair $PWD/admin.json --admin-storage-keypair $PWD/admin-stg.json -h handle2 -e 0x0a93d8cb0Be85B3Ea8f33FA63500D118deBc83F7
*/
