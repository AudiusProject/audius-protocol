import Web3 from "web3";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
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
  deletePlaylist,
  createUser,
  createContentNode,
  updateAdmin,
} from "../lib/lib";
import {
  findDerivedPair,
  getContentNode,
  randomCID,
  randomId,
  getContentNodeWalletAndAuthority,
  convertBNToUserIdSeed,
} from "../lib/utils";

import { Command } from "commander";
import fs from "fs";
import path from "path";
import toml from "toml";

const EthWeb3 = new Web3();

const AUDIUS_PROD_RPC_POOL = "https://audius.rpcpool.com/";
const LOCALHOST_RPC_POOL = "http://localhost:8899";
const SYSTEM_PROGRAM_ID = SystemProgram.programId;

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
  const provider = new AnchorProvider(connection, wallet, opts);
  if (!idl.metadata) {
    const anchorToml = toml.parse(
      fs.readFileSync(path.join(__dirname, "../Anchor.toml"), 'utf8')
    );
    idl.metadata = { address: anchorToml.programs.localnet.audius_data };
  }
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
  adminAuthorityKeypair: Keypair;
  adminAccountKeypair: Keypair;
  verifierKeypair: Keypair;
  ownerKeypairPath: string;
};

async function initAdminCLI(network: string, args: initAdminCLIParams) {
  const { adminAuthorityKeypair, adminAccountKeypair, ownerKeypairPath } = args;
  const cliVars = initializeCLI(network, ownerKeypairPath);
  console.log(`AdminAuthorityKeypair:`);
  console.log(adminAuthorityKeypair.publicKey.toString());
  console.log(`[${adminAuthorityKeypair.secretKey.toString()}]`);
  fs.writeFile(
    "adminAuthorityKeypair.json",
    "[" + adminAuthorityKeypair.secretKey.toString() + "]",
    function (err) {
      if (err) {
        return console.error(err);
      }
      console.log("Wrote to adminAuthorityKeypair.json");
    }
  );

  console.log(`adminAccountKeypair:`);
  console.log(adminAccountKeypair.publicKey.toString());
  console.log(`[${adminAccountKeypair.secretKey.toString()}]`);
  fs.writeFile(
    "adminAccountKeypair.json",
    "[" + adminAccountKeypair.secretKey.toString() + "]",
    function (err) {
      if (err) {
        return console.error(err);
      }
      console.log("Wrote to adminAccountKeypair.json");
    }
  );

  // TODO: Accept variable offset
  let tx = initAdmin({
    payer: cliVars.provider.wallet.publicKey,
    program: cliVars.program,
    adminKeypair: adminAuthorityKeypair,
    adminAccountKeypair,
    verifierKeypair,
  });

  const txHash = await cliVars.provider.sendAndConfirm(tx, [
    adminAccountKeypair,
  ]);

  await cliVars.provider.connection.confirmTransaction(txHash);
  console.log(`Initialized admin with tx=${txHash}`);
}

type initUserCLIParams = {
  userId: anchor.BN;
  metadata: string;
  adminAccount: PublicKey;
  ethAddress: string;
  ownerKeypairPath: string;
  adminAuthorityKeypair: Keypair;
  replicaSet: number[];
  replicaSetBumps: number[];
  cn1: PublicKey;
  cn2: PublicKey;
  cn3: PublicKey;
};

async function initUserCLI(args: initUserCLIParams) {
  const {
    adminAuthorityKeypair,
    userId,
    ethAddress,
    ownerKeypairPath,
    metadata,
    adminAccount,
    replicaSet,
    replicaSetBumps,
    cn1,
    cn2,
    cn3,
  } = args;
  const cliVars = initializeCLI(network, ownerKeypairPath);
  const { baseAuthorityAccount, bumpSeed, derivedAddress: userAccount } =
    await findDerivedPair(
      cliVars.programID,
      adminAccount,
      convertBNToUserIdSeed(userId)
    );

  console.log("Initing user");
  const tx = initUser({
    payer: cliVars.provider.wallet.publicKey,
    program: cliVars.program,
    ethAddress,
    replicaSet,
    replicaSetBumps,
    userId,
    bumpSeed,
    metadata,
    userAccount,
    baseAuthorityAccount,
    adminAccount,
    adminAuthorityPublicKey: adminAuthorityKeypair.publicKey,
    cn1,
    cn2,
    cn3,
  });
  const txHash = await cliVars.provider.sendAndConfirm(tx, [adminAuthorityKeypair]);

  await cliVars.provider.connection.confirmTransaction(txHash);

  console.log(
    `Initialized user with id=${userId}, tx=${txHash}, userAcct=${userAccount}`
  );
}

async function timeManageEntity(
  args: CreateEntityParams,
  provider: AnchorProvider,
  manageAction: any,
  entityType: any,
  userAuthorityKeypair: anchor.web3.Keypair
) {
  let retries = 5;
  let err = null;
  while (retries > 0) {
    try {
      const start = Date.now();
      let tx;

      console.log(
        `Transacting on entity with type=${JSON.stringify(entityType)}, id=${
          args.id
        }`
      );

      if (
        manageAction == ManagementActions.create &&
        entityType == EntityTypesEnumValues.track
      ) {
        const transaction = createTrack({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityPublicKey: userAuthorityKeypair.publicKey,
          userAccount: args.userAccount,
          metadata: args.metadata,
          userId: args.userId,
          adminAccount: args.adminAccount,
          bumpSeed: args.bumpSeed,
          userAuthorityDelegateAccount: args.userAuthorityDelegateAccount,
          authorityDelegationStatusAccount:
            args.authorityDelegationStatusAccount,
        });
        tx = await provider.sendAndConfirm(transaction, [userAuthorityKeypair]);
      } else if (
        manageAction == ManagementActions.create &&
        entityType == EntityTypesEnumValues.playlist
      ) {
        const transaction = createPlaylist({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityPublicKey: userAuthorityKeypair.publicKey,
          userAccount: args.userAccount,
          metadata: args.metadata,
          userId: args.userId,
          adminAccount: args.adminAccount,
          bumpSeed: args.bumpSeed,
          userAuthorityDelegateAccount: args.userAuthorityDelegateAccount,
          authorityDelegationStatusAccount:
            args.authorityDelegationStatusAccount,
        });
        tx = await provider.sendAndConfirm(transaction, [userAuthorityKeypair]);
      } else if (
        manageAction == ManagementActions.update &&
        entityType == EntityTypesEnumValues.playlist
      ) {
        const transaction = updatePlaylist({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityPublicKey: args.userAuthorityPublicKey,
          userAccount: args.userAccount,
          metadata: args.metadata,
          userId: args.userId,
          adminAccount: args.adminAccount,
          bumpSeed: args.bumpSeed,
          userAuthorityDelegateAccount: args.userAuthorityDelegateAccount,
          authorityDelegationStatusAccount:
            args.authorityDelegationStatusAccount,
        });
        tx = await provider.sendAndConfirm(transaction, [userAuthorityKeypair]);
      } else if (
        manageAction == ManagementActions.delete &&
        entityType == EntityTypesEnumValues.playlist
      ) {
        const transaction = deletePlaylist({
          id: args.id,
          program: args.program,
          baseAuthorityAccount: args.baseAuthorityAccount,
          userAuthorityPublicKey: args.userAuthorityPublicKey,
          userAccount: args.userAccount,
          userId: args.userId,
          adminAccount: args.adminAccount,
          bumpSeed: args.bumpSeed,
          userAuthorityDelegateAccount: args.userAuthorityDelegateAccount,
          authorityDelegationStatusAccount:
            args.authorityDelegationStatusAccount,
        });
        tx = await provider.sendAndConfirm(transaction, [userAuthorityKeypair]);
      }

      await provider.connection.confirmTransaction(tx);
      const duration = Date.now() - start;
      console.log(
        `Processed tx=${tx} in duration=${duration}, user=${options.userAccount}`
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
  updateAdmin: "updateAdmin",
  initUser: "initUser",
  initContentNode: "initContentNode",
  initUserSolPubkey: "initUserSolPubkey",
  createUser: "createUser",
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
  .option(
    "-aak, --admin-account-keypair <keypair>",
    "admin account keypair path"
  )
  .option("-uid, --user-id <integer>", "user id number")
  .option("-e, --eth-address <string>", "user/cn eth address")
  .option("-u, --user-solana-keypair <string>", "user admin sol keypair path")
  .option(
    "-ua, --user-account <string>",
    "user sol id-based PDA pubkey"
  )
  .option(
    "-eth-pk, --eth-private-key <string>",
    "private key for message signing"
  )
  .option("--metadata <string>", "metadata CID")
  .option("--num-tracks <integer>", "number of tracks to generate")
  .option("--num-playlists <integer>", "number of playlists to generate")
  .option("--id <integer>", "ID of entity targeted by transaction")
  .option("-sp-id, --cn-sp-id <string>", "ID of incoming content node")
  .option(
    "--deterministic, <boolean>",
    "set to false to seed content node wallet and pkey dynamically from local env (only when running ganache without --deterministic)",
    "true"
  )
  .option("-uid, --user-id <integer>", "ID of incoming user")
  .option(
    "-we, --write-enabled <bool>",
    "If write is enabled for admin",
    "false"
  )
  .option(
    "--user-replica-set <string>",
    "Comma separated list of integers representing spIDs - ex. 2,3,1"
  )
  .option("-d, --delegate <string>", "user delegate account pda")
  .option(
    "-ds, --delegate-status <string>",
    "user authority delegation status pda"
  );

program.parse(process.argv);

const options = program.opts();

// Conditionally load keys if provided
// Admin key used to control accounts
const adminAuthorityKeypair = options.adminAuthorityKeypair
  ? keypairFromFilePath(options.adminAuthorityKeypair)
  : anchor.web3.Keypair.generate();

// Admin storage keypair, referenced internally
// Keypair technically only necessary the first time this is initialized
const adminAccountKeypair = options.adminAccountKeypair
  ? keypairFromFilePath(options.adminAccountKeypair)
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
  : process.env.NODE_ENV === "production"
  ? AUDIUS_PROD_RPC_POOL
  : LOCALHOST_RPC_POOL;

const main = async () => {
  const cliVars = initializeCLI(network, options.ownerKeypair);
  const userAuthorityDelegateAccount =
    options.userAuthorityDelegateAccount ?? SYSTEM_PROGRAM_ID;
  const authorityDelegationStatusAccountPDA =
    options.authorityDelegationStatusAccountPDA ?? SYSTEM_PROGRAM_ID;
  let { userId } = options;
  let userIdSeed;
  if (userId) {
    userId = new anchor.BN(userId);
    userIdSeed = convertBNToUserIdSeed(userId);
  }
  console.log(`Calling function: ${options.function}`);
  switch (options.function) {
    case functionTypes.initAdmin:
      console.log(`Initializing admin`);
      initAdminCLI(network, {
        ownerKeypairPath: options.ownerKeypair,
        adminAuthorityKeypair,
        adminAccountKeypair,
        verifierKeypair: verifierKeypair,
      });
      break;
    case functionTypes.initContentNode: {
      console.log(`Initializing content node`);
      const { delegateWallet, contentNodeAuthority } =
        getContentNodeWalletAndAuthority({
          spId: options.cnSpId,
          deterministic: options.deterministic === "true",
        });
      console.log(
        `Using spID=${options.cnSpId} ethAddress=${delegateWallet}, delegateOwnerWallet (aka authority) = ${contentNodeAuthority.publicKey}, secret=[${contentNodeAuthority.secretKey}]`
      );

      const cnInfo = await getContentNode(
        cliVars.program,
        adminAccountKeypair.publicKey,
        `${options.cnSpId}`
      );
      const { baseAuthorityAccount } = await findDerivedPair(
        cliVars.programID,
        adminAccountKeypair.publicKey,
        []
      );
      const tx = createContentNode({
        payer: cliVars.provider.wallet.publicKey,
        program: cliVars.program,
        baseAuthorityAccount,
        adminAuthorityPublicKey: adminAuthorityKeypair.publicKey,
        adminAccount: adminAccountKeypair.publicKey,
        contentNodeAuthority: contentNodeAuthority.publicKey,
        contentNodeAccount: cnInfo.derivedAddress,
        spID: cnInfo.spId,
        ownerEthAddress: delegateWallet,
      });
      const txHash = await cliVars.provider.sendAndConfirm(tx, [adminAuthorityKeypair]);

      console.log(`Initialized with ${txHash}`);
      break;
    }
    case functionTypes.initUser: {
      console.log(`Initializing user`);
      const userReplicaSet = options.userReplicaSet.split(",").map((x) => {
        return parseInt(x);
      });
      console.log(userReplicaSet);
      const userContentNodeInfo = await Promise.all(
        userReplicaSet.map(async (x) => {
          return await getContentNode(
            cliVars.program,
            adminAccountKeypair.publicKey,
            `${x}`
          );
        })
      );

      const replicaSetBumps = [
        userContentNodeInfo[0].bumpSeed,
        userContentNodeInfo[1].bumpSeed,
        userContentNodeInfo[2].bumpSeed,
      ];

      initUserCLI({
        ownerKeypairPath: options.ownerKeypair,
        ethAddress: options.ethAddress,
        userId: userId,
        adminAccount: adminAccountKeypair.publicKey,
        adminAuthorityKeypair,
        metadata: randomCID(),
        replicaSet: userReplicaSet,
        replicaSetBumps,
        cn1: userContentNodeInfo[0].derivedAddress,
        cn2: userContentNodeInfo[1].derivedAddress,
        cn3: userContentNodeInfo[2].derivedAddress,
      });
      break;
    }
    case functionTypes.initUserSolPubkey: {
      const { ethPrivateKey } = options;
      const userSolPubkey = userSolKeypair.publicKey;

      const tx = await initUserSolPubkey({
        program: cliVars.program,
        message: userSolKeypair.publicKey.toBytes(),
        ethPrivateKey,
        userAccount: options.userAccount,
        userAuthorityPublicKey: userSolPubkey,
      });
      const txHash = await cliVars.provider.sendAndConfirm(tx);

      await cliVars.provider.connection.confirmTransaction(txHash);
      console.log(
        `initUserTx = ${txHash}, userAccount = ${options.userAccount}`
      );
      break;
    }
    case functionTypes.updateAdmin: {
      const writeEnabled = options.writeEnabled === "true";

      console.log({ writeEnabled });
      const tx = updateAdmin({
        program: cliVars.program,
        isWriteEnabled: Boolean(writeEnabled),
        adminAccount: adminAccountKeypair.publicKey,
        adminAuthorityKeypair,
      });
      const txHash = await cliVars.provider.sendAndConfirm(tx, [adminAuthorityKeypair]);

      await cliVars.provider.connection.confirmTransaction(txHash);
      console.log(`updateAdmin = ${txHash}`);
      break;
    }
    case functionTypes.createUser: {
      if (!options.metadata) {
        throw new Error("Missing metadata in createUser!");
      }
      const ethAccount = EthWeb3.eth.accounts.create();

      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          cliVars.programID,
          adminAccountKeypair.publicKey,
          userIdSeed
        );

      const userReplicaSetSpIds = options.userReplicaSet.split(",").map((x) => {
        return parseInt(x);
      });
      const userContentNodeInfo = await Promise.all(
        userReplicaSetSpIds.map(async (spId) => {
          return await getContentNode(
            cliVars.program,
            adminAccountKeypair.publicKey,
            `${spId}`
          );
        })
      );
      const replicaSetBumps = [
        userContentNodeInfo[0].bumpSeed,
        userContentNodeInfo[1].bumpSeed,
        userContentNodeInfo[2].bumpSeed,
      ];
      const tx = createUser({
        program: cliVars.program,
        payer: cliVars.provider.wallet.publicKey,
        ethAccount,
        message: userSolKeypair.publicKey.toBytes(),
        userId: userId,
        bumpSeed,
        metadata: options.metadata,
        userAuthorityPublicKey: userSolKeypair.publicKey,
        userAccount: derivedAddress,
        adminAccount: adminAccountKeypair.publicKey,
        baseAuthorityAccount: baseAuthorityAccount,
        replicaSet: userReplicaSetSpIds,
        replicaSetBumps,
        cn1: userContentNodeInfo[0].derivedAddress,
        cn2: userContentNodeInfo[1].derivedAddress,
        cn3: userContentNodeInfo[2].derivedAddress,
      });
      const txHash = await cliVars.provider.sendAndConfirm(tx);
      await cliVars.provider.connection.confirmTransaction(txHash);
      console.log(
        `createUserTx = ${txHash}, userStorageAccount = ${derivedAddress}`
      );
      break;
    }
    /**
     * Track-related functions
     */
    case functionTypes.createTrack: {
      if (!options.metadata) {
        throw new Error("Missing metadata in createTrack!");
      }

      const numTracks = options.numTracks ?? 1;
      console.log(
        `Number of tracks = ${numTracks}, Target User = ${options.userAccount}`
      );

      const promises = [];
      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          cliVars.programID,
          adminAccountKeypair.publicKey,
          userIdSeed
        );

      for (let i = 0; i < numTracks; i++) {
        promises.push(
          timeManageEntity(
            {
              id: randomId(),
              baseAuthorityAccount,
              adminAccount: adminAccountKeypair.publicKey,
              userId: userId,
              program: cliVars.program,
              bumpSeed: bumpSeed,
              metadata: options.metadata,
              userAuthorityPublicKey: userSolKeypair.publicKey,
              userAccount: derivedAddress,
              userAuthorityDelegateAccount: userAuthorityDelegateAccount,
              authorityDelegationStatusAccount:
                authorityDelegationStatusAccountPDA,
            },
            cliVars.provider,
            ManagementActions.create,
            EntityTypesEnumValues.track,
            userSolKeypair
          )
        );
      }
      const start = Date.now();
      await Promise.all(promises);
      console.log(`Processed ${numTracks} tracks in ${Date.now() - start}ms`);
      break;
    }
    /**
     * Playlist-related functions
     */
    case functionTypes.createPlaylist: {
      const numPlaylists = options.numPlaylists ?? 1;
      console.log(
        `Number of playlists = ${numPlaylists}, Target User = ${options.userAccount}`
      );

      const promises = [];
      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          cliVars.programID,
          adminAccountKeypair.publicKey,
          userIdSeed
        );

      for (let i = 0; i < numPlaylists; i++) {
        promises.push(
          timeManageEntity(
            {
              id: randomId(),
              baseAuthorityAccount,
              adminAccount: adminAccountKeypair.publicKey,
              userId: userId,
              program: cliVars.program,
              bumpSeed: bumpSeed,
              metadata: randomCID(),
              userAuthorityPublicKey: userSolKeypair.publicKey,
              userAccount: options.userAccount,
              userAuthorityDelegateAccount: userAuthorityDelegateAccount,
              authorityDelegationStatusAccount:
                authorityDelegationStatusAccountPDA,
            },
            cliVars.provider,
            ManagementActions.create,
            EntityTypesEnumValues.playlist,
            userSolKeypair
          )
        );
      }
      const start = Date.now();
      await Promise.all(promises);
      console.log(
        `Processed ${numPlaylists} playlists in ${Date.now() - start}ms`
      );
      break;
    }
    case functionTypes.updatePlaylist: {
      const playlistId = new anchor.BN(options.id);
      if (!playlistId) break;
      console.log(
        `Playlist id = ${playlistId} Target User = ${options.userAccount}`
      );

      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          cliVars.programID,
          adminAccountKeypair.publicKey,
          userIdSeed
        );
      const start = Date.now();
      await timeManageEntity(
        {
          id: playlistId,
          baseAuthorityAccount,
          adminAccount: adminAccountKeypair.publicKey,
          userId: userId,
          program: cliVars.program,
          bumpSeed: bumpSeed,
          metadata: randomCID(),
          userAuthorityPublicKey: userSolKeypair.publicKey,
          userAccount: options.userAccount,
          userAuthorityDelegateAccount: userAuthorityDelegateAccount,
          authorityDelegationStatusAccount: authorityDelegationStatusAccountPDA,
        },
        cliVars.provider,
        ManagementActions.update,
        EntityTypesEnumValues.playlist,
        userSolKeypair
      );
      console.log(`Updated playlist ${playlistId} in ${Date.now() - start}ms`);
      break;
    }
    case functionTypes.deletePlaylist: {
      const playlistId = new anchor.BN(options.id);
      if (!playlistId) break;
      console.log(
        `Playlist id = ${playlistId} Target User = ${options.userAccount}`
      );

      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          cliVars.programID,
          adminAccountKeypair.publicKey,
          userIdSeed
        );
      const start = Date.now();
      await timeManageEntity(
        {
          id: playlistId,
          baseAuthorityAccount,
          adminAccount: adminAccountKeypair.publicKey,
          userId: userId,
          program: cliVars.program,
          bumpSeed: bumpSeed,
          metadata: randomCID(),
          userAuthorityPublicKey: userSolKeypair.publicKey,
          userAccount: options.userAccount,
          userAuthorityDelegateAccount: userAuthorityDelegateAccount,
          authorityDelegationStatusAccount: authorityDelegationStatusAccountPDA,
        },
        cliVars.provider,
        ManagementActions.update,
        EntityTypesEnumValues.playlist,
        userSolKeypair
      );
      console.log(`Deleted playlist ${playlistId} in ${Date.now() - start}ms`);
      break;
    }
  }
};

main();
