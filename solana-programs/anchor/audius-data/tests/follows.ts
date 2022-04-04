import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect, assert } from "chai";
import { initAdmin, updateAdmin } from "../lib/lib";
import { findDerivedPair, getTransactionWithData } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  createSolanaContentNode,
  initTestConstants,
  testCreateUser,
  testCreateUserDelegate,
} from "./test-helpers";

const { SystemProgram } = anchor.web3;

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
  const adminStorageKeypair = anchor.web3.Keypair.generate();
  const verifierKeypair = anchor.web3.Keypair.generate();
  const contentNodes = {};
  const getURSMParams = () => {
    return {
      replicaSet: [
        contentNodes["1"].spId.toNumber(),
        contentNodes["2"].spId.toNumber(),
        contentNodes["3"].spId.toNumber(),
      ],
      replicaSetBumps: [
        contentNodes["1"].seedBump.bump,
        contentNodes["2"].seedBump.bump,
        contentNodes["3"].seedBump.bump,
      ],
      cn1: contentNodes["1"].pda,
      cn2: contentNodes["2"].pda,
      cn3: contentNodes["3"].pda,
    };
  };

  it("follows - Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStorageKeypair,
      verifierKeypair,
    });

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStorageKeypair.publicKey
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

  it("Initializing Content Node accounts!", async function () {
    const cn1 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(1),
    });
    const cn2 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(2),
    });
    const cn3 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(3),
    });
    contentNodes["1"] = cn1;
    contentNodes["2"] = cn2;
    contentNodes["3"] = cn3;
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
        adminStorageKeypair.publicKey,
        Buffer.from(handleBytesArray1)
      );

      handle2DerivedInfo = await findDerivedPair(
        program.programId,
        adminStorageKeypair.publicKey,
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
        adminStorageAccount: adminStorageKeypair.publicKey,
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
        userStorageAccount: userStorageAccount1,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        userId: constants1.userId,
        ...getURSMParams(),
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
        userStorageAccount: userStorageAccount2,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        userId: constants2.userId,
        ...getURSMParams(),
      });
    });

    it("follow user", async function () {
      // Submit a tx where user 1 follows user 2
      const followArgs = {
        accounts: {
          audiusAdmin: adminStorageKeypair.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
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

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, followTx, 0);

      expect(decodedInstruction.name).to.equal("followUser");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.followUser
      );
      expect(decodedData.followerHandle.seed).to.deep.equal(
        constants1.handleBytesArray
      );
      expect(decodedData.followeeHandle.seed).to.deep.equal(
        constants2.handleBytesArray
      );
      expect(accountPubKeys[0]).to.equal(
        adminStorageKeypair.publicKey.toString()
      );
      expect(accountPubKeys[5]).to.equal(newUser1Key.publicKey.toString());
    });

    it("delegate follows user", async function () {
      const userDelegate = await testCreateUserDelegate({
        adminKeypair,
        adminStorageKeypair: adminStorageKeypair,
        program,
        provider,
      });

      // Submit a tx where user 1 follows user 2
      const followArgs = {
        accounts: {
          audiusAdmin: adminStorageKeypair.publicKey,
          authority: userDelegate.userAuthorityDelegateKeypair.publicKey,
          followerUserStorage: userDelegate.userAccountPDA,
          followeeUserStorage: userStorageAccount2,
          userAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
          authorityDelegationStatus: userDelegate.authorityDelegationStatusPDA,
        },
        signers: [userDelegate.userAuthorityDelegateKeypair],
      };

      const followTx = await program.rpc.followUser(
        baseAuthorityAccount,
        UserActionEnumValues.followUser,
        {
          seed: userDelegate.userHandleBytesArray,
          bump: userDelegate.userBumpSeed,
        },
        { seed: handleBytesArray2, bump: handle2DerivedInfo.bumpSeed },
        followArgs
      );

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, followTx, 0);

      expect(decodedInstruction.name).to.equal("followUser");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.followUser
      );
      expect(decodedData.followerHandle.seed).to.deep.equal(
        userDelegate.userHandleBytesArray
      );
      expect(decodedData.followeeHandle.seed).to.deep.equal(
        constants2.handleBytesArray
      );
      expect(accountPubKeys[0]).to.equal(
        adminStorageKeypair.publicKey.toString()
      );
      expect(accountPubKeys[5]).to.equal(
        userDelegate.userAuthorityDelegateKeypair.publicKey.toString()
      );
    });

    it("unfollow user", async function () {
      // Submit a tx where user 1 follows user 2
      const followArgs = {
        accounts: {
          audiusAdmin: adminStorageKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
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

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, unfollowTx, 0);

      expect(decodedInstruction.name).to.equal("followUser");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.unfollowUser
      );
      expect(decodedData.followerHandle.seed).to.deep.equal(
        constants1.handleBytesArray
      );
      expect(decodedData.followeeHandle.seed).to.deep.equal(
        constants2.handleBytesArray
      );
      expect(accountPubKeys[0]).to.equal(
        adminStorageKeypair.publicKey.toString()
      );
      expect(accountPubKeys[5]).to.equal(newUser1Key.publicKey.toString());
    });

    it("submit invalid follow action", async function () {
      // Submit a tx where user 1 follows user 2
      let expectedErrorFound = false;
      const followArgs = {
        accounts: {
          audiusAdmin: adminStorageKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: userStorageAccount2,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
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
          audiusAdmin: adminStorageKeypair.publicKey,
          payer: provider.wallet.publicKey,
          authority: newUser1Key.publicKey,
          followerUserStorage: userStorageAccount1,
          followeeUserStorage: wrongUserKeypair.publicKey,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
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
