import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
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
  const verifierKeypair = anchor.web3.Keypair.generate();

  it("follows - Initializing admin account!", async () => {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
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
      const message1 = newUser1Key.publicKey.toString();
      const message2 = newUser2Key.publicKey.toString();

      // disable admin writes
      await updateAdmin({
        program,
        isWriteEnabled: false,
        adminStgAccount: adminStgKeypair.publicKey,
        adminAuthorityKeypair: adminKeypair,
      })

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
      let expectedErrorString = "The program expected this account to be already initialized";
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
      } catch (e) {
        let index = e.toString().indexOf(expectedErrorString);
        console.dir(e, { depth: 5 })
        if (index >= 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, `Expect to find ${expectedErrorString}`);
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
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          // Note the intentionally incorrect handle bytes below for followee target PDA
          handleBytesArray1,
          handle1DerivedInfo.bumpSeed,
          followArgs
        );
      } catch (e) {
        let index = e.toString().indexOf(expectedErrorString);
        console.dir(e, { depth: 5 })
        if (index >= 0) expectedErrorFound = true;
      }
      assert.equal(expectedErrorFound, true, `Expected to find ${expectedErrorString}`);
    });
  });
});
