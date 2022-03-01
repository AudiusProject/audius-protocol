import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createTrack, initAdmin, updateUser, updateAdmin, updateTrack, deleteTrack, updateIsVerified } from "../lib/lib";
import { findDerivedPair, randomCID } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  initTestConstants,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
} from "./test-helpers";

chai.use(chaiAsPromised);

describe("audius-data", () => {
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

  const testCreateTrack = async ({
    trackMetadata,
    newTrackKeypair,
    userAuthorityKeypair,
    trackOwnerPDA,
    adminStgKeypair,
  }) => {
    const tx = await createTrack({
      provider,
      program,
      newTrackKeypair,
      userAuthorityKeypair,
      userStgAccountPDA: trackOwnerPDA,
      metadata: trackMetadata,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    const track = await program.account.track.fetch(
      newTrackKeypair.publicKey
    );

    const chainOwner = track.owner.toString();
    const expectedOwner = trackOwnerPDA.toString();
    expect(chainOwner, "track owner").to.equal(expectedOwner);

    console.log(
      `track: ${trackMetadata}, trackId assigned = ${track.trackId}`
    );

    await confirmLogInTransaction(provider, tx, trackMetadata);
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

    await deleteTrack({
      provider,
      program,
      trackPDA: trackKeypair.publicKey,
      userStgAccountPDA: trackOwnerPDA,
      userAuthorityKeypair: userAuthorityKeypair,
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
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
      trackIdOffset: new anchor.BN("0"),
      playlistIdOffset: new anchor.BN("0"),
    });
    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    const chainAuthority = adminAccount.authority.toString();
    const expectedAuthority = adminKeypair.publicKey.toString();
    expect(chainAuthority, "authority").to.equal(expectedAuthority);
    expect(adminAccount.isWriteEnabled, "is_write_enabled").to.equal(true);
  });

  it("Initializing user!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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
  });

  it("Initializing + claiming user!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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
      newUserKeypair,
      newUserAcctPDA,
    });
  });

  it("Initializing + claiming user with bad message should fail!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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
    const message = anchor.web3.Keypair.generate().publicKey.toBytes();

    await expect (testInitUserSolPubkey({
      provider,
      program,
      message,
      ethPrivateKey: ethAccount.privateKey,
      newUserKeypair,
      newUserAcctPDA,
    })).to.be.rejectedWith(Error);
  });

  it("Initializing + claiming + updating user!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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
      newUserKeypair,
      newUserAcctPDA,
    });

    const updatedCID = randomCID();
    const tx = await updateUser({
      program,
      metadata: updatedCID,
      userStgAccount: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
    });
    await confirmLogInTransaction(provider, tx, updatedCID);
  });

  it("Initializing + claiming user, creating + updating track", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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
      newUserKeypair,
      newUserAcctPDA,
    });

    const newTrackKeypair = anchor.web3.Keypair.generate();
    const trackMetadata = randomCID();

    await testCreateTrack({
      trackMetadata,
      newTrackKeypair,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      adminStgKeypair,
    });

    // Expected signature validation failure
    const newTrackKeypair2 = anchor.web3.Keypair.generate();
    const wrongUserKeypair = anchor.web3.Keypair.generate();
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

    const updatedTrackMetadata = randomCID();
    console.log(`Updating track`);
    const tx3 = await updateTrack({
      program,
      trackPDA: newTrackKeypair.publicKey,
      userStgAccountPDA: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
      metadata: updatedTrackMetadata,
    })
    await confirmLogInTransaction(provider, tx3, updatedTrackMetadata);
  });

  it("Creating user with admin writes enabled should fail", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

    // enable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: true,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    })

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

   await expect (testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    })).to.be.rejectedWith(Error)

  });

  it("Creating user with bad message should fail!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    })

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = anchor.web3.Keypair.generate().publicKey.toBytes();

    await expect(testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    })).to.be.rejectedWith(Error);;
  });


  it("Creating user!", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    })

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    await expect(testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    })).to.eventually.be.rejected.and.property('logs').to.include(
      `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
    );
  });

  it("creating initialized user should fail", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
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

    await expect(testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    })).to.eventually.be.rejected.and.property('logs').to.include(
      `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
    );
  });

  it("creating user with incorrect bump seed / pda should fail", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    const { handleBytesArray: incorrectHandleBytesArray } = initTestConstants();

    const { derivedAddress: incorrectPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(incorrectHandleBytesArray)
      );

    await expect(testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: incorrectPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    })).to.eventually.be.rejected.and.property('logs').to.include(
      `Program ${program.programId.toString()} failed: Cross-program invocation with unauthorized signer or writable account`
    );
  });

  it("Verify user", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });
    let tx = await updateIsVerified({
      program,
      adminKeypair: adminStgKeypair,
      userStgAccount: newUserAcctPDA,
      verifierKeypair,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed
    });

    await confirmLogInTransaction(provider, tx, 'success');
  });

  it("creating + deleting a track", async () => {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

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

    const newTrackKeypair = anchor.web3.Keypair.generate();

    const trackMetadata = randomCID();
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
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed, derivedAddress: newUserAcctPDA } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray)
      );

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

    const newTrackKeypair = anchor.web3.Keypair.generate();
    const newTrackKeypair2 = anchor.web3.Keypair.generate();
    const newTrackKeypair3 = anchor.web3.Keypair.generate();
    const trackMetadata = randomCID();
    const trackMetadata2 = randomCID();
    const trackMetadata3 = randomCID();
    const start = Date.now();
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
