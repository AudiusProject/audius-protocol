import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect, assert } from "chai";
import {
  followUser,
  initAdmin,
  subscribeUser,
  unfollowUser,
  unsubscribeUser,
  updateAdmin,
} from "../lib/lib";
import { findDerivedPair, getTransactionWithData, convertBNToUserIdSeed } from "../lib/utils";
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
  unsubscribeUser: { unsubscribeUser: {} },
  subscribeUser: { subscribeUser: {} },
  invalidEnumValue: { invalidEnum: {} },
};
describe("user social actions", function () {
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

  it("User social actions - Initializing admin account!", async function () {
    let tx = initAdmin({
      payer: provider.wallet.publicKey,
      program,
      adminKeypair,
      adminStorageKeypair,
      verifierKeypair,
    });

    await provider.send(tx, [adminStorageKeypair]);

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

  describe("user social action tests", function () {
    let constants1;
    let constants2;
    let userId1;
    let userId2;
    // New sol keys that will be used to permission user updates
    let newUser1Key;
    let newUser2Key;
    let userStorageAccount1;
    let userStorageAccount2;
    let baseAuthorityAccount;
    let userId1DerivedInfo;
    let userId2DerivedInfo;

    // Initialize user for each test
    beforeEach(async function () {
      // Initialize 2 users
      constants1 = initTestConstants();
      constants2 = initTestConstants();
      userId1 = constants1.userId;
      userId2 = constants2.userId;

      userId1DerivedInfo = await findDerivedPair(
        program.programId,
        adminStorageKeypair.publicKey,
        convertBNToUserIdSeed(userId1)
      );

      userId2DerivedInfo = await findDerivedPair(
        program.programId,
        adminStorageKeypair.publicKey,
        convertBNToUserIdSeed(userId2)
      );

      baseAuthorityAccount = userId1DerivedInfo.baseAuthorityAccount;

      userStorageAccount1 = userId1DerivedInfo.derivedAddress;
      userStorageAccount2 = userId2DerivedInfo.derivedAddress;

      // New sol keys that will be used to permission user updates
      newUser1Key = anchor.web3.Keypair.generate();
      newUser2Key = anchor.web3.Keypair.generate();

      // Generate signed SECP instruction
      // Message as the incoming public key
      const message1 = newUser1Key.publicKey.toBytes();
      const message2 = newUser2Key.publicKey.toBytes();

      // disable admin writes
      const updateAdminTx = updateAdmin({
        program,
        isWriteEnabled: false,
        adminStorageAccount: adminStorageKeypair.publicKey,
        adminAuthorityKeypair: adminKeypair,
      });
      await provider.send(updateAdminTx, [adminKeypair]);

      await testCreateUser({
        provider,
        program,
        message: message1,
        baseAuthorityAccount,
        ethAccount: constants1.ethAccount,
        userId: userId1,
        bumpSeed: userId1DerivedInfo.bumpSeed,
        metadata: constants1.metadata,
        newUserKeypair: newUser1Key,
        userStorageAccount: userStorageAccount1,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      });

      await testCreateUser({
        provider,
        program,
        message: message2,
        baseAuthorityAccount,
        ethAccount: constants2.ethAccount,
        userId: userId2,
        bumpSeed: userId2DerivedInfo.bumpSeed,
        metadata: constants2.metadata,
        newUserKeypair: newUser2Key,
        userStorageAccount: userStorageAccount2,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      });
    });

    it("follow user", async function () {
      // Submit a tx where user 1 follows user 2
      const followTx = followUser({
        baseAuthorityAccount,
        program,
        sourceUserStorageAccountPDA: userStorageAccount1,
        targetUserStorageAccountPDA: userStorageAccount2,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        userAuthorityPublicKey: newUser1Key.publicKey,
        sourceUserId: userId1,
        sourceUserBumpSeed: userId1DerivedInfo.bumpSeed,
        targetUserId: userId2,
        targetUserBumpSeed: userId2DerivedInfo.bumpSeed,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
      });
      const followTxSig = await provider.send(followTx, [newUser1Key])

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, followTxSig, 0);

      expect(decodedInstruction.name).to.equal("writeUserSocialAction");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.followUser
      );
      expect(decodedData.sourceUserIdSeedBump.userId).to.equal(
        constants1.userId.toNumber()
      );
      expect(decodedData.targetUserIdSeedBump.userId).to.equal(
        constants2.userId.toNumber()
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
      const followTx = followUser({
        baseAuthorityAccount,
        program,
        sourceUserStorageAccountPDA: userDelegate.userAccountPDA,
        targetUserStorageAccountPDA: userStorageAccount2,
        userAuthorityDelegateAccountPDA: userDelegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA:
          userDelegate.authorityDelegationStatusPDA,
        userAuthorityPublicKey: userDelegate.userAuthorityDelegateKeypair.publicKey,
        sourceUserId: userDelegate.userId,
        sourceUserBumpSeed: userDelegate.userBumpSeed,
        targetUserId: userId2,
        targetUserBumpSeed: userId2DerivedInfo.bumpSeed,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
      });
      const followTxSig = await provider.send(followTx, [userDelegate.userAuthorityDelegateKeypair])

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, followTxSig, 0);

      expect(decodedInstruction.name).to.equal("writeUserSocialAction");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.followUser
      );
      expect(decodedData.sourceUserIdSeedBump.userId).to.equal(
        userDelegate.userId.toNumber()
      );
      expect(decodedData.targetUserIdSeedBump.userId).to.equal(
        constants2.userId.toNumber()
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
      const unfollowTx = unfollowUser({
        baseAuthorityAccount,
        program,
        sourceUserStorageAccountPDA: userStorageAccount1,
        targetUserStorageAccountPDA: userStorageAccount2,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        userAuthorityPublicKey: newUser1Key.publicKey,
        sourceUserId: userId1,
        sourceUserBumpSeed: userId1DerivedInfo.bumpSeed,
        targetUserId: userId2,
        targetUserBumpSeed: userId2DerivedInfo.bumpSeed,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
      });
      const unfollowTxSig = await provider.send(unfollowTx, [newUser1Key])

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, unfollowTxSig, 0);

      expect(decodedInstruction.name).to.equal("writeUserSocialAction");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.unfollowUser
      );
      expect(decodedData.sourceUserIdSeedBump.userId).to.equal(
        constants1.userId.toNumber()
      );
      expect(decodedData.targetUserIdSeedBump.userId).to.equal(
        constants2.userId.toNumber()
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
          sourceUserStorage: userStorageAccount1,
          targetUserStorage: userStorageAccount2,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
        },
        signers: [newUser1Key],
      };
      try {
        // Use invalid enum value and confirm failure
        const txHash = await program.rpc.writeUserSocialAction(
          baseAuthorityAccount,
          UserActionEnumValues.invalidEnumValue,
          { userId: userId1, bump: userId1DerivedInfo.bumpSeed },
          { userId: userId2, bump: userId2DerivedInfo.bumpSeed },
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
          sourceUserStorage: userStorageAccount1,
          targetUserStorage: wrongUserKeypair.publicKey,
          userAuthorityDelegate: SystemProgram.programId,
          authorityDelegationStatus: SystemProgram.programId,
        },
        signers: [newUser1Key],
      };
      let expectedErrorFound = false;
      let expectedErrorString =
        "The program expected this account to be already initialized";
      try {
        await program.rpc.writeUserSocialAction(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          { userId: userId1, bump: userId1DerivedInfo.bumpSeed },
          { userId: userId2, bump: userId2DerivedInfo.bumpSeed },
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
      followArgs.accounts.targetUserStorage = userStorageAccount2;
      try {
        await program.rpc.writeUserSocialAction(
          baseAuthorityAccount,
          UserActionEnumValues.followUser,
          { userId: userId1, bump: userId1DerivedInfo.bumpSeed },
          // Note the intentionally incorrect user ID below for followee target PDA
          { userId: userId1, bump: userId1DerivedInfo.bumpSeed },
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

    // subscribe tests
    it("subscribe user", async function () {
      // Submit a tx where user 1 subscribes user 2
      const subscribeTx = subscribeUser({
        baseAuthorityAccount,
        program,
        sourceUserStorageAccountPDA: userStorageAccount1,
        targetUserStorageAccountPDA: userStorageAccount2,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        userAuthorityPublicKey: newUser1Key.publicKey,
        sourceUserId: userId1,
        sourceUserBumpSeed: userId1DerivedInfo.bumpSeed,
        targetUserId: userId2,
        targetUserBumpSeed: userId2DerivedInfo.bumpSeed,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
      });
      const subscribeTxSig = await provider.send(subscribeTx, [newUser1Key])

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, subscribeTxSig, 0);

      expect(decodedInstruction.name).to.equal("writeUserSocialAction");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.subscribeUser
      );
      expect(decodedData.sourceUserIdSeedBump.userId).to.equal(
        constants1.userId.toNumber()
      );
      expect(decodedData.targetUserIdSeedBump.userId).to.equal(
        constants2.userId.toNumber()
      );
      expect(accountPubKeys[0]).to.equal(
        adminStorageKeypair.publicKey.toString()
      );
      expect(accountPubKeys[5]).to.equal(newUser1Key.publicKey.toString());
    });

    it("unsubscribe user", async function () {
      // Submit a tx where user 1 subscribes user 2
      const unsubscribeTx = unsubscribeUser({
        baseAuthorityAccount,
        program,
        sourceUserStorageAccountPDA: userStorageAccount1,
        targetUserStorageAccountPDA: userStorageAccount2,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        userAuthorityPublicKey: newUser1Key.publicKey,
        sourceUserId: userId1,
        sourceUserBumpSeed: userId1DerivedInfo.bumpSeed,
        targetUserId: userId2,
        targetUserBumpSeed: userId2DerivedInfo.bumpSeed,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
      });
      const unsubscribeTxSig = await provider.send(unsubscribeTx, [newUser1Key])

      const { decodedInstruction, decodedData, accountPubKeys } =
        await getTransactionWithData(program, provider, unsubscribeTxSig, 0);

      expect(decodedInstruction.name).to.equal("writeUserSocialAction");
      expect(decodedData.base.toString()).to.equal(
        baseAuthorityAccount.toString()
      );
      expect(decodedData.userAction).to.deep.equal(
        UserActionEnumValues.unsubscribeUser
      );
      expect(decodedData.sourceUserIdSeedBump.userId).to.equal(
        constants1.userId.toNumber()
      );
      expect(decodedData.targetUserIdSeedBump.userId).to.equal(
        constants2.userId.toNumber()
      );
      expect(accountPubKeys[0]).to.equal(
        adminStorageKeypair.publicKey.toString()
      );
      expect(accountPubKeys[5]).to.equal(newUser1Key.publicKey.toString());
    });
  });
});
