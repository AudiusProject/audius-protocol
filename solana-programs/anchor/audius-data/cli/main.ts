import { Program, Provider, web3 } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AudiusData } from "../target/types/audius_data";
import * as anchor from "@project-serum/anchor";
import {
  initAdmin,
  initUser,
  initUserSolPubkey,
  CreateEntityParams,
  createTrack,
  ManagementActions,
  EntityTypesEnumValues,
  createPlaylist,
  updatePlaylist,
} from "../lib/lib";
import { findDerivedPair, randomCID, randomString } from "../lib/utils";

import { Command } from "commander";
import fs = require("fs");

import { readFileSync } from 'fs';

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

function getHandleBytesArray(handle: string){
  const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle));
  const handleBytesArray = Array.from({ ...handleBytes, length: 16 });
  return handleBytesArray
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
  fs.writeFile('adminKeypair.json', "[" + adminKeypair.secretKey.toString() + "]",  function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("Wrote to adminKeypair.json");
  });

  console.log(`adminStorageKeypair:`);
  console.log(adminStorageKeypair.publicKey.toString());
  console.log(`[${adminStorageKeypair.secretKey.toString()}]`);
  fs.writeFile('adminStorageKeypair.json',  "[" + adminStorageKeypair.secretKey.toString() + "]",  function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("Wrote to adminStorageKeypair.json");
  });

  // TODO: Accept variable offset
  let tx = await initAdmin({
    provider: cliVars.provider,
    program: cliVars.program,
    adminKeypair,
    adminStorageKeypair,
    verifierKeypair
  });
  await cliVars.provider.connection.confirmTransaction(tx);
  console.log("Initialized admin.")
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
  const handleBytesArray = getHandleBytesArray(handle);
  const { baseAuthorityAccount, bumpSeed, derivedAddress } = await findDerivedPair(cliVars.programID, adminStoragePublicKey, handleBytesArray);

  const userStorageAddress = derivedAddress;
  console.log("initing user")
  const tx = await initUser({
    provider: cliVars.provider,
    program: cliVars.program,
    ethAddress,
    handleBytesArray,
    bumpSeed,
    metadata,
    userStorageAccount: userStorageAddress,
    baseAuthorityAccount,
    adminStorageAccount: adminStoragePublicKey,
    adminKeypair,
  });

  await cliVars.provider.connection.confirmTransaction(tx);

  console.log(
    `Initialized user=${handle}, tx=${tx}, userAcct=${userStorageAddress}`
  );
}

async function timeManageEntity(args: CreateEntityParams, provider: Provider, manageAction: any, entityType: any) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      let tx;
      if (manageAction == ManagementActions.create && entityType == EntityTypesEnumValues.track) {
        tx = await createTrack({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityKeypair: args.userAuthorityKeypair,
          userStorageAccountPDA: args.userStorageAccountPDA,
          metadata: args.metadata,
          handleBytesArray: args.handleBytesArray,
          adminStorageAccount: args.adminStorageAccount,
          bumpSeed: args.bumpSeed,
        });
      } else if (manageAction == ManagementActions.create && entityType == EntityTypesEnumValues.playlist) {
        tx = await createPlaylist({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityKeypair: args.userAuthorityKeypair,
          userStorageAccountPDA: args.userStorageAccountPDA,
          metadata: args.metadata,
          handleBytesArray: args.handleBytesArray,
          adminStorageAccount: args.adminStorageAccount,
          bumpSeed: args.bumpSeed,
        });
      } else if (manageAction == ManagementActions.update && entityType == EntityTypesEnumValues.playlist) {
        tx = await updatePlaylist({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityKeypair: args.userAuthorityKeypair,
          userStorageAccountPDA: args.userStorageAccountPDA,
          metadata: args.metadata,
          handleBytesArray: args.handleBytesArray,
          adminStorageAccount: args.adminStorageAccount,
          bumpSeed: args.bumpSeed,
        });
      }

      await provider.connection.confirmTransaction(tx);
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

// async function timeCreatePlaylist(args: CreateEntityParams) {
//   let retries = 5;
//   let err = null;
//   while (retries > 0) {
//     try {
//       const start = Date.now();
//       const tx = await createPlaylist({
//         program: args.program,
//         provider: args.provider,
//         newPlaylistKeypair: args.newPlaylistKeypair,
//         userStorageAccountPDA: args.userStorageAccountPDA,
//         userAuthorityKeypair: args.userAuthorityKeypair,
//         adminStoragePublicKey: args.adminStoragePublicKey,
//         metadata: randomCID(),
//       });
//       const duration = Date.now() - start;
//       console.log(
//         `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
//       );
//       return tx;
//     } catch (e) {
//       err = e;
//     }
//     retries--;
//   }
//   console.log(err);
// }

// async function timeUpdatePlaylist(args: UpdateEntityParams) {
//   let retries = 5;
//   let err = null;
//   while (retries > 0) {
//     try {
//       const start = Date.now();
//       const tx = await updatePlaylist({
//         program: args.program,
//         playlistPublicKey: args.playlistPublicKey,
//         userStorageAccountPDA: args.userStorageAccountPDA,
//         userAuthorityKeypair: args.userAuthorityKeypair,
//         metadata: args.metadata,
//       });
//       const duration = Date.now() - start;
//       console.log(
//         `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
//       );
//       return tx;
//     } catch (e) {
//       err = e;
//     }
//     retries--;
//   }
//   console.log(err);
// }

// async function timeDeletePlaylist(args: DeleteEntityParams) {
//   let retries = 5;
//   let err = null;
//   while (retries > 0) {
//     try {
//       const start = Date.now();
//       const tx = await deletePlaylist({
//         program: args.program,
//         provider: args.provider,
//         playlistPublicKey: args.playlistPublicKey,
//         userStorageAccountPDA: args.userStorageAccountPDA,
//         userAuthorityKeypair: args.userAuthorityKeypair,
//       });
//       const duration = Date.now() - start;
//       console.log(
//         `Processed ${tx} in ${duration}, user=${options.userStoragePubkey}`
//       );
//       return tx;
//     } catch (e) {
//       err = e;
//     }
//     retries--;
//   }
//   console.log(err);
// }

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
      await cliVars.provider.connection.confirmTransaction(tx);
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
      const handleBytesArray = getHandleBytesArray(options.handle);
      const { baseAuthorityAccount, bumpSeed, derivedAddress } = await findDerivedPair(cliVars.programID, adminStorageKeypair.publicKey, handleBytesArray);

      for (let i = 0; i < numTracks; i++) {
        promises.push(
          timeManageEntity({
            id: randomString(10),
            baseAuthorityAccount,
            adminStorageAccount: adminStorageKeypair.publicKey,
            handleBytesArray: handleBytesArray,
            program: cliVars.program,
            bumpSeed: bumpSeed,
            metadata: randomCID(),
            userAuthorityKeypair: userSolKeypair,
            userStorageAccountPDA: options.userStoragePubkey,
          }, cliVars.provider, ManagementActions.create, EntityTypesEnumValues.track)
        );
      }
      const start = Date.now();
      await Promise.all(promises);
      console.log(`Processed ${numTracks} tracks in ${Date.now() - start}ms`);
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
      const handleBytesArray = getHandleBytesArray(options.handle);
      const { baseAuthorityAccount, bumpSeed, derivedAddress } = await findDerivedPair(cliVars.programID, adminStorageKeypair.publicKey, handleBytesArray);

      for (let i = 0; i < numPlaylists; i++) {
        promises.push(
          timeManageEntity({
            id: randomString(10),
            baseAuthorityAccount,
            adminStorageAccount: adminStorageKeypair.publicKey,
            handleBytesArray: handleBytesArray,
            program: cliVars.program,
            bumpSeed: bumpSeed,
            metadata: randomCID(),
            userAuthorityKeypair: userSolKeypair,
            userStorageAccountPDA: options.userStoragePubkey,
          }, cliVars.provider, ManagementActions.create, EntityTypesEnumValues.playlist)
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
      const handleBytesArray = getHandleBytesArray(options.handle);
      const { baseAuthorityAccount, bumpSeed, derivedAddress } = await findDerivedPair(cliVars.programID, adminStorageKeypair.publicKey, handleBytesArray);
      const start = Date.now();
      await timeManageEntity({
          id: randomString(10),
          baseAuthorityAccount,
          adminStorageAccount: adminStorageKeypair.publicKey,
          handleBytesArray: handleBytesArray,
          program: cliVars.program,
          bumpSeed: bumpSeed,
          metadata: randomCID(),
          userAuthorityKeypair: userSolKeypair,
          userStorageAccountPDA: options.userStoragePubkey,
        }, cliVars.provider, ManagementActions.update, EntityTypesEnumValues.playlist);
      console.log(
        `Processed playlist ${playlistPublicKey} in ${Date.now() - start}ms`
      );
    })();
    break;
  }
  // case functionTypes.deletePlaylist: {
  //   const playlistPublicKey = options.playlistPubkey;
  //   if (!playlistPublicKey) break;
  //   console.log(
  //     `Playlist public key = ${playlistPublicKey}, Target User = ${options.userStoragePubkey}`
  //   );
  //   (async () => {
  //     const cliVars = initializeCLI(network, options.ownerKeypair);
  //     const start = Date.now();
  //     await timeDeletePlaylist({
  //       program: cliVars.program,
  //       provider: cliVars.provider,
  //       playlistPublicKey,
  //       userAuthorityKeypair: userSolKeypair,
  //       userStorageAccountPDA: options.userStoragePubkey,
  //     });
  //     console.log(
  //       `Processed playlist ${playlistPublicKey} in ${Date.now() - start}ms`
  //     );
  //   })();
  //   break;
  // }
  // case functionTypes.getPlaylistId:
  //   (async () => {
  //     const cliVars = initializeCLI(network, options.ownerKeypair);
  //     const info = await cliVars.program.account.audiusAdmin.fetch(
  //       adminStorageKeypair.publicKey
  //     );
  //     console.log(`playlistID high:${info.playlistId}`);
  //   })();
  //   break;
}
