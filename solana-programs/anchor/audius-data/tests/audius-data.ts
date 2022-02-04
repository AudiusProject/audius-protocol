import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import ethWeb3 from "web3";
import { createTrack, initAdmin } from "../lib/lib";
import { findDerivedPair, randomCID } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  initTestConstants,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
} from "./test-helpers";

const { PublicKey } = anchor.web3;

describe("audius-data", () => {
  const provider = anchor.Provider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;
  const EthWeb3 = new ethWeb3();
  const DefaultPubkey = new PublicKey("11111111111111111111111111111111");

  let adminKeypair = anchor.web3.Keypair.generate();
  let adminStgKeypair = anchor.web3.Keypair.generate();

  const testCreateTrack = async ({
    trackMetadata,
    newTrackKeypair,
    userAuthorityKeypair,
    trackOwnerPDA,
    adminStgKeypair,
  }) => {
    let tx = await createTrack({
      provider,
      program,
      newTrackKeypair,
      userAuthorityKeypair,
      userStgAccountPDA: trackOwnerPDA,
      metadata: trackMetadata,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });
    await confirmLogInTransaction(provider, tx, trackMetadata);
    let assignedTrackId = await program.account.track.fetch(
      newTrackKeypair.publicKey
    );
    console.log(
      `track: ${trackMetadata}, trackId assigned = ${assignedTrackId.trackId}`
    );
  };

  const testDeleteTrack = async ({
    trackKeypair,
    trackOwnerPDA,
    userAuthorityKeypair,
  }) => {
    const initialTrackAcctBalance = await provider.connection.getBalance(
      trackKeypair.publicKey
    );
    const initialPayerBalance = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    await program.rpc.deleteTrack({
      accounts: {
        track: trackKeypair.publicKey,
        user: trackOwnerPDA,
        authority: userAuthorityKeypair.publicKey,
        payer: provider.wallet.publicKey,
      },
      signers: [userAuthorityKeypair],
    });

    // Confirm that the account is zero'd out
    // Note that there appears to be a delay in the propagation, hence the retries
    let trackAcctBalance = initialTrackAcctBalance;
    let payerBalance = initialPayerBalance;
    let retries = 20;
    while (trackAcctBalance > 0 && retries > 0) {
      trackAcctBalance = await provider.connection.getBalance(
        trackKeypair.publicKey
      );
      payerBalance = await provider.connection.getBalance(
        provider.wallet.publicKey
      );
      retries--;
    }

    if (trackAcctBalance > 0) {
      throw new Error("Failed to deallocate track");
    }

    console.log(
      `Track acct lamports ${initialTrackAcctBalance} -> ${trackAcctBalance}`
    );
    console.log(
      `Payer acct lamports ${initialPayerBalance} -> ${payerBalance}`
    );
  };

  it("Initializing admin account!", async () => {
    await initAdmin({
      provider: provider,
      program: program,
      adminKeypair: adminKeypair,
      adminStgKeypair: adminStgKeypair,
      trackIdOffset: new anchor.BN("0"),
      playlistIdOffset: new anchor.BN("0"),
    });

    let adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );
    if (!adminAccount.authority.equals(adminKeypair.publicKey)) {
      console.log(
        "On chain retrieved admin info: ",
        adminAccount.authority.toString()
      );
      console.log("Provided admin info: ", adminKeypair.publicKey.toString());
      throw new Error("Invalid returned values");
    }
  });

  it("Initializing user!", async () => {
    let { testEthAddr, testEthAddrBytes, handleBytesArray, metadata } =
      initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });
  });

  it("Initializing + claiming user!", async () => {
    let {
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata,
    } = initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      pkString,
      newUserKeypair,
      newUserAcctPDA,
    });
  });

  it("Initializing + claiming + updating user!", async () => {
    let {
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata,
    } = initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      pkString,
      newUserKeypair,
      newUserAcctPDA,
    });

    let updatedCID = randomCID();
    let tx = await program.rpc.updateUser(updatedCID, {
      accounts: {
        user: newUserAcctPDA,
        userAuthority: newUserKeypair.publicKey,
      },
      signers: [newUserKeypair],
    });
    await confirmLogInTransaction(provider, tx, updatedCID);
  });

  it("Initializing + claiming user, creating + updating track", async () => {
    let {
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata,
    } = initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      pkString,
      newUserKeypair,
      newUserAcctPDA,
    });

    // TODO: Abstract track creation function
    let newTrackKeypair = anchor.web3.Keypair.generate();
    let trackMetadata = randomCID();

    await testCreateTrack({
      trackMetadata,
      newTrackKeypair,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      adminStgKeypair,
    });

    // Expected signature validation failure
    let newTrackKeypair2 = anchor.web3.Keypair.generate();
    let wrongUserKeypair = anchor.web3.Keypair.generate();
    console.log(
      `Expecting error with public key ${wrongUserKeypair.publicKey}`
    );
    try {
      await testCreateTrack({
        trackMetadata,
        newTrackKeypair: newTrackKeypair2,
        userAuthorityKeypair: wrongUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        adminStgKeypair,
      });
    } catch (e) {
      console.log(`Error found as expected ${e}`);
    }

    let updatedTrackMetadata = randomCID();
    console.log(`Updating track`);
    let tx3 = await program.rpc.updateTrack(updatedTrackMetadata, {
      accounts: {
        track: newTrackKeypair.publicKey,
        user: newUserAcctPDA,
        authority: newUserKeypair.publicKey,
        payer: provider.wallet.publicKey,
      },
      signers: [newUserKeypair],
    });
    await confirmLogInTransaction(provider, tx3, updatedTrackMetadata);
  });

  it("Creating user!", async () => {
    let { testEthAddr, testEthAddrBytes, handleBytesArray, metadata, pkString } =
      initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testCreateUser({
      provider,
      program,
      message,
      pkString,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });


    let errored = false;
    try {
      await testCreateUser({
        provider,
        program,
        message,
        pkString,
        baseAuthorityAccount,
        testEthAddr,
        testEthAddrBytes,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      });
    } catch (e) {
      errored = true;
      console.log(`Error found as expected ${e} - when trying to create user that already exists`);
    }

    if (!errored) {
      throw new Error('Creating existing user did not fail');
    }
  });

  it("creating initialized user should fail", async () => {
    let { testEthAddr, testEthAddrBytes, handleBytesArray, metadata, pkString } =
      initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    let errored = false;
    try {
      await testCreateUser({
        provider,
        program,
        message,
        pkString,
        baseAuthorityAccount,
        testEthAddr,
        testEthAddrBytes,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      });
    } catch (e) {
      errored = true;
      console.log(`Error found as expected ${e} - when trying to create a user that was initialized`);
    }

    if (!errored) {
      throw new Error('Creating an already initialized user did not fail');
    }
  });

  it("creating + deleting a track", async () => {
    let {
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata,
    } = initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      pkString,
      newUserKeypair,
      newUserAcctPDA,
    });

    let newTrackKeypair = anchor.web3.Keypair.generate();

    let trackMetadata = randomCID();
    await testCreateTrack({
      trackMetadata,
      newTrackKeypair,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      adminStgKeypair,
    });

    await testDeleteTrack({
      trackKeypair: newTrackKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
    });
  });

  it("create multiple tracks in parallel", async () => {
    let {
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata,
    } = initTestConstants();

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );
    let newUserAcctPDA = derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    let newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKeypair.publicKey.toString();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      pkString,
      newUserKeypair,
      newUserAcctPDA,
    });

    let newTrackKeypair = anchor.web3.Keypair.generate();
    let newTrackKeypair2 = anchor.web3.Keypair.generate();
    let newTrackKeypair3 = anchor.web3.Keypair.generate();
    let trackMetadata = randomCID();
    let trackMetadata2 = randomCID();
    let trackMetadata3 = randomCID();
    let start = Date.now();
    await Promise.all([
      testCreateTrack({
        trackMetadata,
        newTrackKeypair,
        adminStgKeypair,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
      }),
      testCreateTrack({
        trackMetadata: trackMetadata2,
        adminStgKeypair,
        newTrackKeypair: newTrackKeypair2,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
      }),
      testCreateTrack({
        trackMetadata: trackMetadata3,
        adminStgKeypair,
        newTrackKeypair: newTrackKeypair3,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
      }),
    ]);
    console.log(`Created 3 tracks in ${Date.now() - start}ms`);
  });
});
