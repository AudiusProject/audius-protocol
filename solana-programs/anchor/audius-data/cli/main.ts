import { Program, Provider, web3 } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AudiusData } from "../target/types/audius_data";
import * as anchor from "@project-serum/anchor";
import { randomCID, findDerivedPair } from "../lib/utils";
import {
  initAdmin,
  initUser,
  initUserSolPubkey,
  createTrack,
  CreateTrackParams,
  CreatePlaylistParams,
  createPlaylist,
  DeletePlaylistParams,
  deletePlaylist,
  updatePlaylist,
  UpdatePlaylistParams,
} from "../lib/lib";

import { Command } from "commander";
import fs = require("fs");

const AUDIUS_PROD_RPC_POOL = "https://audius.rpcpool.com/";
const LOCALHOST_RPC_POOL = "http://localhost:8899";

const program = new Command();

const idl = JSON.parse(
  fs.readFileSync("./target/idl/audius_data.json", "utf8")
);

const opts: web3.ConfirmOptions = {
  skipPreflight: true,
  preflightCommitment: "confirmed",
};

const keypairFromFilePath = (path: string) => {
  /* eslint-disable */
  return Keypair.fromSecretKey(Uint8Array.from(require(path)));
};


/// Initialize constants requird for any CLI functionality
function initializeCLI(network: string, ownerKeypairPath: string) {
  const connection = new Connection(network, opts.preflightCommitment);
  const ownerKeypair = keypairFromFilePath(ownerKeypairPath);
  const wallet = new NodeWallet(ownerKeypair);
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
  adminStorageKeypair: Keypair;
  verifierKeypair: Keypair;
  ownerKeypairPath: string;
};

async function initAdminCLI(network: string, args: initAdminCLIParams) {
  const { adminKeypair, adminStorageKeypair, ownerKeypairPath } = args;
  const cliVars = initializeCLI(network, ownerKeypairPath);
  console.log(`AdminKeypair:`);
  console.log(adminKeypair.publicKey.toString());
  console.log(`[${adminKeypair.secretKey.toString()}]`);
  console.log(
    `echo "[${adminKeypair.secretKey.toString()}]" > adminKeypair.json`
  );
  console.log(`adminStorageKeypair:`);
  console.log(adminStorageKeypair.publicKey.toString());
  console.log(`[${adminStorageKeypair.secretKey.toString()}]`);
  console.log(
    `echo "[${adminStorageKeypair.secretKey.toString()}]" > adminStorageKeypair.json`
  );
  // TODO: Accept variable offset
  let tx = await initAdmin({
    provider: cliVars.provider,
    program: cliVars.program,
    adminKeypair,
    adminStorageKeypair,
    verifierKeypair,
    trackIdOffset: new anchor.BN("0"),
    playlistIdOffset: new anchor.BN("0"),
  });
  await cliVars.provider.connection.confirmTransaction(tx);
}

type initUserCLIParams = {
  handle: string;
  metadata: string;
  adminStoragePublicKey: PublicKey;
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
    adminStoragePublicKey,
  } = args;
  const cliVars = initializeCLI(network, ownerKeypairPath);
  const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle));
  const handleBytesArray = Array.from({ ...handleBytes, length: 16 });
  const { baseAuthorityAccount, bumpSeed, derivedAddress } =
    await findDerivedPair(
      cliVars.program.programId,
      adminStorageKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

  const userStorageAddress = derivedAddress;
  const tx = await initUser({
    provider: cliVars.provider,
    program: cliVars.program,
    ethAddress,
    handleBytesArray,
    bumpSeed,
    metadata,
    userStorageAccount: userStorageAddress,
    baseAuthorityAccount,
    adminStorageKey: adminStoragePublicKey,
    adminKeypair,
  });
  console.log(
    `Initialized user=${handle}, tx=${tx}, userAcct=${userStorageAddress}`
  );
}

async function timeCreateTrack(args: CreateTrackParams) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      const tx = await createTrack({
        program: args.program,
        provider: args.provider,
        metadata: args.metadata,
        newTrackKeypair: args.newTrackKeypair,
        userAuthorityKeypair: args.userAuthorityKeypair,
        userStorageAccountPDA: args.userStorageAccountPDA,
        adminStoragePublicKey: args.adminStoragePublicKey,
      });
      const duration = Date.now() - start;
      console.log(
        `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
      );
      return tx;
    } catch (e) {
      err = e;
    }
    retries--;
  }
  console.log(err);
}

async function timeCreatePlaylist(args: CreatePlaylistParams) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      const tx = await createPlaylist({
        program: args.program,
        provider: args.provider,
        newPlaylistKeypair: args.newPlaylistKeypair,
        userStorageAccountPDA: args.userStorageAccountPDA,
        userAuthorityKeypair: args.userAuthorityKeypair,
        adminStoragePublicKey: args.adminStoragePublicKey,
        metadata: randomCID(),
      });
      const duration = Date.now() - start;
      console.log(
        `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
      );
      return tx;
    } catch (e) {
      err = e;
    }
    retries--;
  }
  console.log(err);
}

async function timeUpdatePlaylist(args: UpdatePlaylistParams) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      const tx = await updatePlaylist({
        program: args.program,
        playlistPublicKey: args.playlistPublicKey,
        userStorageAccountPDA: args.userStorageAccountPDA,
        userAuthorityKeypair: args.userAuthorityKeypair,
        metadata: args.metadata,
      });
      const duration = Date.now() - start;
      console.log(
        `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
      );
      return tx;
    } catch (e) {
      err = e;
    }
    retries--;
  }
  console.log(err);
}

async function timeDeletePlaylist(args: DeletePlaylistParams) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      const tx = await deletePlaylist({
        program: args.program,
        provider: args.provider,
        playlistPublicKey: args.playlistPublicKey,
        userStorageAccountPDA: args.userStorageAccountPDA,
        userAuthorityKeypair: args.userAuthorityKeypair,
      });
      const duration = Date.now() - start;
      console.log(
        `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
      );
      return tx;
    } catch (e) {
      err = e;
    }
    retries--;
  }
  console.log(err);
}

const functionTypes = Object.freeze({
  initAdmin: "initAdmin",
  initUser: "initUser",
  initUserSolPubkey: "initUserSolPubkey",
  createTrack: "createTrack",
  getTrackId: "getTrackId",
  createPlaylist: "createPlaylist",
  updatePlaylist: "updatePlaylist",
  deletePlaylist: "deletePlaylist",
  getPlaylistId: "getPlaylistId",
});

program
  .option("-f, --function <type>", "function to invoke")
  .option("-n, --network <string>", "solana network")
  .option("-k, --owner-keypair <keypair>", "owner keypair path")
  .option("-ak, --admin-keypair <keypair>", "admin keypair path")
  .option("-ask, --admin-storage-keypair <keypair>", "admin storage keypair path")
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
  .option("--num-tracks <integer>", "number of tracks to generate")
  .option("--num-playlists <integer>", "number of playlists to generate")
  .option("--playlist-pubkey <integer>", "playlist to update or delete");

program.parse(process.argv);

const options = program.opts();

// Conditionally load keys if provided
// Admin key used to control accounts
const adminKeypair = options.adminKeypair
  ? keypairFromFilePath(options.adminKeypair)
  : anchor.web3.Keypair.generate();

// Admin storage keypair, referenced internally
// Keypair technically only necessary the first time this is initialized
const adminStorageKeypair = options.adminStorageKeypair
  ? keypairFromFilePath(options.adminStorageKeypair)
  : anchor.web3.Keypair.generate();

// User admin keypair
const userSolKeypair = options.userSolanaKeypair
  ? keypairFromFilePath(options.userSolanaKeypair)
  : anchor.web3.Keypair.generate();

// Verifier keypair for audius admin
const verifierKeypair = options.verifierKeypair
  ? keypairFromFilePath(options.verifierKeypair)
  : anchor.web3.Keypair.generate();

const network = options.network
  ? options.network
  : process.env.NODE_ENV === 'production'
    ? AUDIUS_PROD_RPC_POOL
    : LOCALHOST_RPC_POOL;

switch (options.function) {
  case functionTypes.initAdmin:
    console.log(`Initializing admin`);
    initAdminCLI(network, {
      ownerKeypairPath: options.ownerKeypair,
      adminKeypair: adminKeypair,
      adminStorageKeypair: adminStorageKeypair,
      verifierKeypair: verifierKeypair,
    });
    break;
  case functionTypes.initUser:
    console.log(`Initializing user`);
    console.log(options);
    initUserCLI({
      ownerKeypairPath: options.ownerKeypair,
      ethAddress: options.ethAddress,
      handle: options.handle,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      adminKeypair,
      metadata: "test",
    });
    break;
  case functionTypes.initUserSolPubkey:
    const { ethPrivateKey } = options;
    const userSolPubkey = userSolKeypair.publicKey;
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      const tx = await initUserSolPubkey({
        program: cliVars.program,
        provider: cliVars.provider,
        message: userSolKeypair.publicKey.toBytes(),
        ethPrivateKey,
        userStorageAccount: options.userStoragePubkey,
        userSolPubkey,
      });
      console.log(
        `initUserTx = ${tx}, userStorageAccount = ${options.userStoragePubkey}`
      );
    })();
    break;
  /**
   * Track-related functions
   */
  case functionTypes.createTrack:
    const numTracks = options.numTracks ? options.numTracks : 1;
    console.log(
      `Number of tracks = ${numTracks}, Target User = ${options.userStoragePubkey}`
    );
    (async () => {
      const promises = [];
      const cliVars = initializeCLI(network, options.ownerKeypair);
      for (let i = 0; i < numTracks; i++) {
        promises.push(
          timeCreateTrack({
            program: cliVars.program,
            provider: cliVars.provider,
            metadata: randomCID(),
            newTrackKeypair: anchor.web3.Keypair.generate(),
            userAuthorityKeypair: userSolKeypair,
            userStorageAccountPDA: options.userStoragePubkey,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
          })
        );
      }
      const start = Date.now();
      await Promise.all(promises);
      console.log(`Processed ${numTracks} tracks in ${Date.now() - start}ms`);
    })();
    break;
  case functionTypes.getTrackId:
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      const info = await cliVars.program.account.audiusAdmin.fetch(
        adminStorageKeypair.publicKey
      );
      console.log(`trackID high:${info.trackId}`);
    })();
    break;
  /**
   * Playlist-related functions
   */
  case functionTypes.createPlaylist:
    const numPlaylists = options.numPlaylists ? options.numPlaylists : 1;
    console.log(
      `Number of playlists = ${numPlaylists}, Target User = ${options.userStoragePubkey}`
    );
    (async () => {
      const promises = [];
      const cliVars = initializeCLI(network, options.ownerKeypair);
      for (let i = 0; i < numPlaylists; i++) {
        promises.push(
          timeCreatePlaylist({
            program: cliVars.program,
            provider: cliVars.provider,
            metadata: randomCID(),
            newPlaylistKeypair: anchor.web3.Keypair.generate(),
            userAuthorityKeypair: userSolKeypair,
            userStorageAccountPDA: options.userStoragePubkey,
            adminStoragePublicKey: adminStorageKeypair.publicKey,
          })
        );
      }
      const start = Date.now();
      await Promise.all(promises);
      console.log(
        `Processed ${numPlaylists} playlists in ${Date.now() - start}ms`
      );
    })();
    break;
  case functionTypes.updatePlaylist: {
    const playlistPublicKey = options.playlistPubkey;
    if (!playlistPublicKey) break;
    console.log(
      `Playlist public key = ${playlistPublicKey}, Target User = ${options.userStoragePubkey}`
    );
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      const start = Date.now();
      await timeUpdatePlaylist({
        program: cliVars.program,
        metadata: randomCID(),
        playlistPublicKey,
        userAuthorityKeypair: userSolKeypair,
        userStorageAccountPDA: options.userStoragePubkey,
      });
      console.log(
        `Processed playlist ${playlistPublicKey} in ${Date.now() - start}ms`
      );
    })();
    break;
  }
  case functionTypes.deletePlaylist: {
    const playlistPublicKey = options.playlistPubkey;
    if (!playlistPublicKey) break;
    console.log(
      `Playlist public key = ${playlistPublicKey}, Target User = ${options.userStoragePubkey}`
    );
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      const start = Date.now();
      await timeDeletePlaylist({
        program: cliVars.program,
        provider: cliVars.provider,
        playlistPublicKey,
        userAuthorityKeypair: userSolKeypair,
        userStorageAccountPDA: options.userStoragePubkey,
      });
      console.log(
        `Processed playlist ${playlistPublicKey} in ${Date.now() - start}ms`
      );
    })();
    break;
  }
  case functionTypes.getPlaylistId:
    (async () => {
      const cliVars = initializeCLI(network, options.ownerKeypair);
      const info = await cliVars.program.account.audiusAdmin.fetch(
        adminStorageKeypair.publicKey
      );
      console.log(`playlistID high:${info.playlistId}`);
    })();
    break;
}
