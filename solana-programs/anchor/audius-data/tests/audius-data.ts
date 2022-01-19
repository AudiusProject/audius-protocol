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
      console.log(`ERROR FOUND AS EXPECTED ${e}`);
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

  it("Follow/Unfollow user", async () => {
    // Initialize 2 users
    let constants1 = initTestConstants();
    let constants2 = initTestConstants();
    let handleBytesArray1 = constants1.handleBytesArray;
    let handleBytesArray2 = constants2.handleBytesArray;

    let { baseAuthorityAccount, bumpSeed, derivedAddress } =
      await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray1)
      );
    let derivedInfo2 = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray2)
    );

    let userStorageAccount1 = derivedAddress;
    let newUserAcct2PDA = derivedInfo2.derivedAddress;

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr: constants1.testEthAddr,
      testEthAddrBytes: constants1.testEthAddrBytes,
      handleBytesArray: handleBytesArray1,
      bumpSeed,
      metadata: constants1.metadata,
      userStgAccount: userStorageAccount1,
      adminKeypair,
      adminStgKeypair,
    });

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      testEthAddr: constants2.testEthAddr,
      testEthAddrBytes: constants2.testEthAddrBytes,
      handleBytesArray: handleBytesArray2,
      bumpSeed: derivedInfo2.bumpSeed,
      metadata: constants2.metadata,
      userStgAccount: newUserAcct2PDA,
      adminKeypair,
      adminStgKeypair,
    });

    // New sol keys that will be used to permission user updates
    let newUser1Key = anchor.web3.Keypair.generate();
    let newUser2Key = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message1 = newUser1Key.publicKey.toString();
    let message2 = newUser2Key.publicKey.toString();

    console.log("initialized");

    await testInitUserSolPubkey({
      provider,
      program,
      message: message1,
      pkString: constants1.pkString,
      newUserKeypair: newUser1Key,
      newUserAcctPDA: userStorageAccount1,
    });
    await testInitUserSolPubkey({
      provider,
      program,
      message: message2,
      pkString: constants2.pkString,
      newUserKeypair: newUser2Key,
      newUserAcctPDA: newUserAcct2PDA,
    });

    // Submit a tx where user 1 follows user 2
    let followArgs = {
      accounts: {
        audiusAdmin: adminStgKeypair.publicKey,
        payer: provider.wallet.publicKey,
        authority: newUser1Key.publicKey,
        followerUserStg: userStorageAccount1,
        followeeUserStg: newUserAcct2PDA,
      },
      signers: [newUser1Key],
    };
    let followTx = await program.rpc.followUser(
      { followUser: {} },
      handleBytesArray1,
      handleBytesArray2,
      followArgs
    );
    let txInfo = await confirmLogInTransaction(
      provider,
      followTx,
      "Audius::FollowUser"
    );
    const decodedInstruction = program.coder.instruction.decode(
      txInfo.transaction.message.instructions[0].data,
      "base58"
    );
    // Validate deserialized instructions match input
    // Confirms user handles passed on chain validation
    // Can be used during indexing or external tx inspection
    const instructions = decodedInstruction.data;
    const user1Handle = String.fromCharCode(...constants1.handleBytesArray);
    const user2Handle = String.fromCharCode(...constants2.handleBytesArray);
    const instructionFollowerHandle = String.fromCharCode(
      ...instructions["followerHandleSeed"]
    );
    const instructionFolloweeHandle = String.fromCharCode(
      ...instructions["followeeHandleSeed"]
    );
    assert.equal(user1Handle, instructionFollowerHandle);
    assert.equal(user2Handle, instructionFolloweeHandle);
    let unfollowTx = await program.rpc.followUser(
      { unfollowUser: {} },
      handleBytesArray1,
      handleBytesArray2,
      followArgs
    );
    let unFollowtxInfo = await confirmLogInTransaction(
      provider,
      unfollowTx,
      "Audius::UnfollowUser"
    );
    const unFollowdecodedInstruction = program.coder.instruction.decode(
      unFollowtxInfo.transaction.message.instructions[0].data,
      "base58"
    );
    const unfollowInstructions = decodedInstruction.data;
    const unfInstructionFollowerHandle = String.fromCharCode(
      ...unfollowInstructions["followerHandleSeed"]
    );
    const unfInstructionFolloweeHandle = String.fromCharCode(
      ...unfollowInstructions["followeeHandleSeed"]
    );
    assert.equal(user1Handle, unfInstructionFollowerHandle);
    assert.equal(user2Handle, unfInstructionFolloweeHandle);
  });
});
