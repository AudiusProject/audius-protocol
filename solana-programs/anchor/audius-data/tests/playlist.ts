import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { initAdmin, updateAdmin } from "../lib/lib";
import { findDerivedPair, randomCID, randomString } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  testCreatePlaylist,
  initTestConstants,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
  testDeletePlaylist,
  testUpdatePlaylist,
} from "./test-helpers";

chai.use(chaiAsPromised);

describe("audius-data", function () {
  const provider = anchor.Provider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  const adminKeypair = anchor.web3.Keypair.generate();
  const adminStgKeypair = anchor.web3.Keypair.generate();
  const verifierKeypair = anchor.web3.Keypair.generate();

  it("Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
    });
    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    const chainAuthority = adminAccount.authority.toString();
    const expectedAuthority = adminKeypair.publicKey.toString();
    expect(chainAuthority, "authority").to.equal(expectedAuthority);
    expect(adminAccount.isWriteEnabled, "is_write_enabled").to.equal(true);
  });

  it("Initializing + claiming user, creating + updating playlist", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      ethPrivateKey: ethAccount.privateKey,
      newUserPublicKey: newUserKeypair.publicKey,
      newUserAcctPDA,
    });

    const playlistMetadata = randomCID();
    const playlistID = randomString(10);

    await testCreatePlaylist({
      provider,
      program,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      id: playlistID,
      playlistMetadata,
      userAuthorityKeypair: newUserKeypair,
      playlistOwnerPDA: newUserAcctPDA,
      adminStgAccount: adminStgKeypair.publicKey,
    });

    // Expected signature validation failure
    const wrongUserKeypair = anchor.web3.Keypair.generate();
    console.log(
      `Expecting error with public key ${wrongUserKeypair.publicKey}`
    );
    try {
      await testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        id: randomString(10),
        playlistMetadata,
        userAuthorityKeypair: wrongUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        adminStgAccount: adminStgKeypair.publicKey,
      });
    } catch (e) {
      console.log(`Error found as expected ${e}`);
    }
    const updatedPlaylistMetadata = randomCID();
    await testUpdatePlaylist({
      provider,
      program,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      adminStgAccount: adminStgKeypair.publicKey,
      id: playlistID,
      userStgAccountPDA: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
      metadata: updatedPlaylistMetadata,
    });
  });

  it("creating + deleting a playlist", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });
    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      baseAuthorityAccount,
      ethAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    const playlistMetadata = randomCID();
    const playlistID = randomString(10);

    await testCreatePlaylist({
      provider,
      program,
      id: playlistID,
      baseAuthorityAccount,
      handleBytesArray,
      adminStgAccount: adminStgKeypair.publicKey,
      bumpSeed,
      playlistMetadata,
      userAuthorityKeypair: newUserKeypair,
      playlistOwnerPDA: newUserAcctPDA,
    });

    await testDeletePlaylist({
      provider,
      program,
      id: playlistID,
      playlistOwnerPDA: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      adminStgAccount: adminStgKeypair.publicKey,
    });
  });

  it("create multiple playlists in parallel", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // Disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      baseAuthorityAccount,
      ethAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    const playlistMetadata = randomCID();
    const playlistMetadata2 = randomCID();
    const playlistMetadata3 = randomCID();
    const start = Date.now();
    await Promise.all([
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        playlistMetadata,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
      }),
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        playlistMetadata: playlistMetadata2,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
      }),
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        playlistMetadata: playlistMetadata3,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
      }),
    ]);
    console.log(`Created 3 playlists in ${Date.now() - start}ms`);
  });
});
