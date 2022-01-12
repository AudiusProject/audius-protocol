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
  createTrack,
  createTrackArgs,
} from "../lib/lib";

import { Command } from "commander";
const program = new Command();

const EthWeb3 = new ethWeb3();

const idl = JSON.parse(
  require("fs").readFileSync("./target/idl/audius_data.json", "utf8")
);

const opts: web3.ConfirmOptions = {
  skipPreflight: true,
  preflightCommitment: "confirmed",
};

const keypairFromFilePath = (path: string) => {
  return Keypair.fromSecretKey(Uint8Array.from(require(path)));
};

let network = "https://audius.rpcpool.com/";

/// Initialize constants requird for any CLI functionality
function initializeCLI(network: string, ownerKeypairPath: string) {
  const connection = new Connection(network, opts.preflightCommitment);
  const ownerKeypair = keypairFromFilePath(ownerKeypairPath);
  const wallet = new Wallet(ownerKeypair);
  const provider = new Provider(connection, wallet, opts);
  const programID = new PublicKey(idl.metadata.address);
  const program = new Program<AudiusData>(idl, programID, provider);
  console.log(`Using programID=${programID}`);
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

async function initAdminCLI(network: string, args: initAdminCLIParams) {
  const { adminKeypair, adminStgKeypair, ownerKeypairPath } = args;
  const cliVars = await initializeCLI(network, ownerKeypairPath);
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
    `echo "[${adminStgKeypair.secretKey.toString()}]" > adminStgKeypair.json`
  );
  // TODO: Accept variable offset
  await initAdmin({
    provider: cliVars.provider,
    program: cliVars.program,
    adminKeypair,
    adminStgKeypair,
    trackIdOffset: new anchor.BN("0"),
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
  const cliVars = initializeCLI(network, ownerKeypairPath);
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

async function timeCreateTrack(args: createTrackArgs) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      let start = Date.now();
      let tx = await createTrack({
        program: args.program,
        provider: args.provider,
        metadata: randomCID(),
        newTrackKeypair: anchor.web3.Keypair.generate(),
        userAuthorityKey: userSolKeypair,
        userStgAccountPDA: options.userStgPubkey,
        adminStgPublicKey: args.adminStgPublicKey,
      });
      let duration = Date.now() - start;
      console.log(
        `Processed ${tx} in ${duration}, user=${options.userStgPubkey}`
      );
      return tx;
    } catch (e) {
      err = e;
    }
  }
  console.log(err);
}

const functionTypes = Object.freeze({
  initAdmin: "initAdmin",
  initUser: "initUser",
  initUserSolPubkey: "initUserSolPubkey",
  createTrack: "createTrack",
  getTrackId: "getTrackId",
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
    "-ustg, --user-storage-pubkey <string>",
    "user sol handle-based PDA pubkey"
  )
  .option(
    "-eth-pk, --eth-private-key <string>",
    "private key for message signing"
  )
  .option("--num-tracks <integer>", "number of tracks to generate");

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

// User admin keypair
const userSolKeypair = options.userSolanaKeypair
  ? keypairFromFilePath(options.userSolanaKeypair)
  : anchor.web3.Keypair.generate();

switch (options.function) {
  case functionTypes.initAdmin:
    console.log(`Initializing admin`);
    initAdminCLI(network, {
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
    break;
  case functionTypes.initUserSolPubkey:
    let privateKey = options.ethPrivateKey;
    let userSolPubkey = userSolKeypair.publicKey;
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      let tx = await initUserSolPubkey({
        program: cliVars.program,
        provider: cliVars.provider,
        message: "message",
        privateKey,
        userStgAccount: options.userStgPubkey,
        userSolPubkey,
      });
      console.log(
        `initUserTx = ${tx}, userStgAccount = ${options.userStgPubkey}`
      );
    })();
    break;
  case functionTypes.createTrack:
    const numTracks = options.numTracks ? options.numTracks : 1;
    console.log(
      `Number of tracks = ${numTracks}, Target User = ${options.userStgPubkey}`
    );
    (async () => {
      let promises = [];
      const cliVars = initializeCLI(network, options.ownerKeypair);
      for (var i = 0; i < numTracks; i++) {
        promises.push(
          timeCreateTrack({
            program: cliVars.program,
            provider: cliVars.provider,
            metadata: randomCID(),
            newTrackKeypair: anchor.web3.Keypair.generate(),
            userAuthorityKey: userSolKeypair,
            userStgAccountPDA: options.userStgPubkey,
            adminStgPublicKey: adminStgKeypair.publicKey,
          })
        );
      }
      let start = Date.now();
      await Promise.all(promises);
      console.log(`Processed ${numTracks} in ${Date.now() - start}ms`);
    })();
    break;
  case functionTypes.getTrackId:
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      let info = await cliVars.program.account.audiusAdmin.fetch(
        adminStgKeypair.publicKey
      );
      console.log(`trackID high:${info.trackId}`);
    })();
    break;
}
