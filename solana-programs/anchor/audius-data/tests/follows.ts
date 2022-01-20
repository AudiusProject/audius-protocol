import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { initAdmin } from "../lib/lib";
import { findDerivedPair } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  initTestConstants,
  testInitUser,
  testInitUserSolPubkey,
} from "./test-helpers";

const UserActionEnumValues = {
  unfollowUser: { unfollowUser: {} },
  followUser: { followUser: {} },
  invalidEnumValue: { invalidEnum: {} },
};

describe("follows", () => {
  const provider = anchor.Provider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  let adminKeypair = anchor.web3.Keypair.generate();
  let adminStgKeypair = anchor.web3.Keypair.generate();

  it("follows - Initializing admin account!", async () => {
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

  describe("follow / unfollow tests", () => {
    let constants1;
    let constants2;
    let handleBytesArray1;
    let handleBytesArray2;
    // New sol keys that will be used to permission user updates
    let newUser1Key;
    let newUser2Key;
    let userStorageAccount1;
    let userStorageAccount2;
    let baseAuthorityAccount;
    let handle1DerivedInfo;
    let handle2DerivedInfo;

    // Initialize user for each test
    beforeEach(async () => {
      // Initialize 2 users
      constants1 = initTestConstants();
      constants2 = initTestConstants();
      handleBytesArray1 = constants1.handleBytesArray;
      handleBytesArray2 = constants2.handleBytesArray;

      handle1DerivedInfo = await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray1)
      );
      let derivedAddress = handle1DerivedInfo.derivedAddress;
      let bumpSeed = handle1DerivedInfo.bumpSeed;
      baseAuthorityAccount = handle1DerivedInfo.baseAuthorityAccount;

      handle2DerivedInfo = await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray2)
      );

      userStorageAccount1 = derivedAddress;
      userStorageAccount2 = handle2DerivedInfo.derivedAddress;

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
        bumpSeed: handle2DerivedInfo.bumpSeed,
        metadata: constants2.metadata,
        userStgAccount: userStorageAccount2,
        adminKeypair,
        adminStgKeypair,
      });

      // New sol keys that will be used to permission user updates
      newUser1Key = anchor.web3.Keypair.generate();
      newUser2Key = anchor.web3.Keypair.generate();

      // Generate signed SECP instruction
      // Message as the incoming public key
      let message1 = newUser1Key.publicKey.toString();
      let message2 = newUser2Key.publicKey.toString();

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
        newUserAcctPDA: userStorageAccount2,
      });
    });

    it("follow user", async () => {
      // Submit a tx where user 1 follows user 2
      let followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
        },
        signers: [newUser1Key],
      };
      let followTx = await program.rpc.followUser(
        baseAuthorityAccount,
        UserActionEnumValues.followUser,
        handleBytesArray1,
        handle1DerivedInfo.bumpSeed,
        handleBytesArray2,
        handle2DerivedInfo.bumpSeed,
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
      return;
    });

    it("unfollow user", async () => {
      // Submit a tx where user 1 follows user 2
      let followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
        },
        signers: [newUser1Key],
      };
      let unfollowTx = await program.rpc.followUser(
        baseAuthorityAccount,
        UserActionEnumValues.unfollowUser,
        handleBytesArray1,
        handle1DerivedInfo.bumpSeed,
        handleBytesArray2,
        handle2DerivedInfo.bumpSeed,
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
      const unfollowInstructions = unFollowdecodedInstruction.data;
      const unfInstructionFollowerHandle = String.fromCharCode(
        ...unfollowInstructions["followerHandleSeed"]
      );
      const unfInstructionFolloweeHandle = String.fromCharCode(
        ...unfollowInstructions["followeeHandleSeed"]
      );
      const user1Handle = String.fromCharCode(...constants1.handleBytesArray);
      const user2Handle = String.fromCharCode(...constants2.handleBytesArray);
      assert.equal(user1Handle, unfInstructionFollowerHandle);
      assert.equal(user2Handle, unfInstructionFolloweeHandle);
    });

    it("submit invalid follow action", async () => {
      // Submit a tx where user 1 follows user 2
      let expectedErrorFound = false;
      let followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
        },
        signers: [newUser1Key],
      };
      try {
        // Use invalid enum value and confirm failure
        let txHash = await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.invalidEnumValue,
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          handleBytesArray2,
          handle2DerivedInfo.bumpSeed,
          followArgs
        );
        console.log(`invalid follow txHash=${txHash}`);
      } catch (e: any) {
        let index = e.toString().indexOf("unable to infer src variant");
        if (index > 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, "Unable to infer src variant");
    });

    it("follow invalid user", async () => {
      // Submit a tx where user 1 follows user 2
      // and user 2 account is not a PDA
      let wrongUserKeypair = anchor.web3.Keypair.generate();
      let followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: wrongUserKeypair.publicKey,
        },
        signers: [newUser1Key],
      };
      let expectedErrorFound = false;
      let expectedErrorString = "account is not owned by the executing program";
      try {
        await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          handleBytesArray2,
          handle2DerivedInfo.bumpSeed,
          followArgs
        );
      } catch (e: any) {
        let index = e.toString().indexOf(expectedErrorString);
        if (index > 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, expectedErrorString);
      expectedErrorFound = false;
      expectedErrorString = "seeds constraint was violated";
      // https://github.com/project-serum/anchor/blob/77043131c210cf14a34386cadd9242b1a65daa6e/lang/syn/src/codegen/accounts/constraints.rs#L355
      // Next, submit mismatched arguments
      // followArgs will contain followee target user 2 storage PDA
      // Instructions will point to followee target user 1 storage PDA
      followArgs.accounts.followeeUserStorage = userStorageAccount2;
      try {
        await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          // Note the intentionally incorrect handle bytes below for followee target PDA
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          followArgs
        );
      } catch (e: any) {
        let index = e.toString().indexOf(expectedErrorString);
        if (index > 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, expectedErrorString);
    });
  });
});
