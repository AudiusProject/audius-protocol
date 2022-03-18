import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Program } from "@project-serum/anchor";
import { assert } from "chai";
import { initAdmin, updateAdmin } from "../lib/lib";
import { findDerivedPair } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  initTestConstants,
  testCreateUser,
} from "./test-helpers";

const UserActionEnumValues = {
  unfollowUser: { unfollowUser: {} },
  followUser: { followUser: {} },
  invalidEnumValue: { invalidEnum: {} },
};

describe("follows", function () {
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

  it("follows - Initializing admin account!", async function () {
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
    if (!adminAccount.authority.equals(adminKeypair.publicKey)) {
      console.log(
        "On chain retrieved admin info: ",
        adminAccount.authority.toString()
      );
      console.log("Provided admin info: ", adminKeypair.publicKey.toString());
      throw new Error("Invalid returned values");
    }
  });

  describe("follow / unfollow tests", function () {
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
    beforeEach(async function () {
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

      handle2DerivedInfo = await findDerivedPair(
        program.programId,
        adminStgKeypair.publicKey,
        Buffer.from(handleBytesArray2)
      );

      baseAuthorityAccount = handle1DerivedInfo.baseAuthorityAccount;

      userStorageAccount1 = handle1DerivedInfo.derivedAddress;
      userStorageAccount2 = handle2DerivedInfo.derivedAddress;

      // New sol keys that will be used to permission user updates
      newUser1Key = anchor.web3.Keypair.generate();
      newUser2Key = anchor.web3.Keypair.generate();

      // Generate signed SECP instruction
      // Message as the incoming public key
      const message1 = newUser1Key.publicKey.toBytes();
      const message2 = newUser2Key.publicKey.toBytes();

      // disable admin writes
      await updateAdmin({
        program,
        isWriteEnabled: false,
        adminStgAccount: adminStgKeypair.publicKey,
        adminAuthorityKeypair: adminKeypair,
      });

      await testCreateUser({
        provider,
        program,
        message: message1,
        baseAuthorityAccount,
        ethAccount: constants1.ethAccount,
        handleBytesArray: handleBytesArray1,
        bumpSeed: handle1DerivedInfo.bumpSeed,
        metadata: constants1.metadata,
        newUserKeypair: newUser1Key,
        userStgAccount: userStorageAccount1,
        adminStgPublicKey: adminStgKeypair.publicKey,
      });

      await testCreateUser({
        provider,
        program,
        message: message2,
        baseAuthorityAccount,
        ethAccount: constants2.ethAccount,
        handleBytesArray: handleBytesArray2,
        bumpSeed: handle2DerivedInfo.bumpSeed,
        metadata: constants2.metadata,
        newUserKeypair: newUser2Key,
        userStgAccount: userStorageAccount2,
        adminStgPublicKey: adminStgKeypair.publicKey,
      });
    });

    it("follow user", async function () {
      // Submit a tx where user 1 follows user 2
      const followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
        },
        signers: [newUser1Key],
      };
      const followTx = await program.rpc.followUser(
        baseAuthorityAccount,
        UserActionEnumValues.followUser,
        { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
        { seed: handleBytesArray2, bump: handle2DerivedInfo.bumpSeed },
        followArgs
      );
      const txInfo = await confirmLogInTransaction(
        provider,
        followTx,
        "Audius::FollowUser"
      );

      const instructionCoder = program.coder
        .instruction as BorshInstructionCoder;
      const decodedInstruction = instructionCoder.decode(
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
        ...instructions.followerHandle.seed
      );
      const instructionFolloweeHandle = String.fromCharCode(
        ...instructions.followeeHandle.seed
      );
      assert.equal(user1Handle, instructionFollowerHandle);
      assert.equal(user2Handle, instructionFolloweeHandle);
    });

    it("unfollow user", async function () {
      // Submit a tx where user 1 follows user 2
      const followArgs = {
        accounts: {
          audiusAdmin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
        },
        signers: [newUser1Key],
      };
      const unfollowTx = await program.rpc.followUser(
        baseAuthorityAccount,
        UserActionEnumValues.unfollowUser,
        { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
        { seed: handleBytesArray2, bump: handle2DerivedInfo.bumpSeed },
        followArgs
      );
      const unFollowtxInfo = await confirmLogInTransaction(
        provider,
        unfollowTx,
        "Audius::UnfollowUser"
      );
      const instructionCoder = program.coder
        .instruction as BorshInstructionCoder;
      const unFollowdecodedInstruction = instructionCoder.decode(
        unFollowtxInfo.transaction.message.instructions[0].data,
        "base58"
      );
      const unfollowInstructions = unFollowdecodedInstruction.data;
      const unfInstructionFollowerHandle = String.fromCharCode(
        ...unfollowInstructions.followerHandle.seed
      );
      const unfInstructionFolloweeHandle = String.fromCharCode(
        ...unfollowInstructions.followeeHandle.seed
      );
      const user1Handle = String.fromCharCode(...constants1.handleBytesArray);
      const user2Handle = String.fromCharCode(...constants2.handleBytesArray);
      assert.equal(user1Handle, unfInstructionFollowerHandle);
      assert.equal(user2Handle, unfInstructionFolloweeHandle);
    });

    it("submit invalid follow action", async function () {
      // Submit a tx where user 1 follows user 2
      let expectedErrorFound = false;
      const followArgs = {
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
        const txHash = await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.invalidEnumValue,
          { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
          { seed: handleBytesArray2, bump: handle2DerivedInfo.bumpSeed },
          followArgs
        );
        console.log(`invalid follow txHash=${txHash}`);
      } catch (e) {
        const index = e.toString().indexOf("unable to infer src variant");
        if (index > 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, "Unable to infer src variant");
    });

    it("follow invalid user", async function () {
      // Submit a tx where user 1 follows user 2
      // and user 2 account is not a PDA
      const wrongUserKeypair = anchor.web3.Keypair.generate();
      const followArgs = {
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
      let expectedErrorString =
        "The program expected this account to be already initialized";
      try {
        await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
          { seed: handleBytesArray2, bump: handle2DerivedInfo.bumpSeed },
          followArgs
        );
      } catch (e) {
        const index = e.toString().indexOf(expectedErrorString);
        console.dir(e, { depth: 5 });
        if (index >= 0) expectedErrorFound = true;
      }
      assert.equal(
        expectedErrorFound,
        true,
        `Expect to find ${expectedErrorString}`
      );
      expectedErrorFound = false;
      expectedErrorString = "A seeds constraint was violated";
      // https://github.com/project-serum/anchor/blob/77043131c210cf14a34386cadd9242b1a65daa6e/lang/syn/src/codegen/accounts/constraints.rs#L355
      // Next, submit mismatched arguments
      // followArgs will contain followee target user 2 storage PDA
      // Instructions will point to followee target user 1 storage PDA
      followArgs.accounts.followeeUserStorage = userStorageAccount2;
      try {
        await program.rpc.followUser(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
          // Note the intentionally incorrect handle bytes below for followee target PDA
          { seed: handleBytesArray1, bump: handle1DerivedInfo.bumpSeed },
          followArgs
        );
      } catch (e) {
        const index = e.toString().indexOf(expectedErrorString);
        console.dir(e, { depth: 5 });
        if (index >= 0) expectedErrorFound = true;
      }
      assert.equal(
        expectedErrorFound,
        true,
        `Expected to find ${expectedErrorString}`
      );
    });
  });
});
