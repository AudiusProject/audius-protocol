import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Program } from "@project-serum/anchor";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  initAdmin,
  addTrackRepost,
  addTrackSave,
  updateAdmin,
  deleteTrackSave,
  EntitySocialActionEnumValues,
  EntityTypesEnumValues,
  deleteTrackRepost,
} from "../lib/lib";
import { getTransaction, randomString } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  createSolanaContentNode,
  createSolanaUser,
  testCreateUserDelegate,
} from "./test-helpers";
const { SystemProgram } = anchor.web3;

chai.use(chaiAsPromised);

const contentNodes = {};
describe("track-actions", function () {
  const provider = anchor.AnchorProvider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  const adminKeypair = anchor.web3.Keypair.generate();
  const adminAccountKeypair = anchor.web3.Keypair.generate();
  const verifierKeypair = anchor.web3.Keypair.generate();

  it("track actions - Initializing admin account!", async function () {
    const tx = initAdmin({
      payer: provider.wallet.publicKey,
      program,
      adminKeypair,
      adminAccountKeypair,
      verifierKeypair,
    });

    await provider.sendAndConfirm(tx, [adminAccountKeypair]);

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminAccountKeypair.publicKey
    );
    if (!adminAccount.authority.equals(adminKeypair.publicKey)) {
      console.log(
        "On chain retrieved admin info: ",
        adminAccount.authority.toString()
      );
      console.log("Provided admin info: ", adminKeypair.publicKey.toString());
      throw new Error("Invalid returned values");
    }

    // disable admin writes
    const updateAdminTx = updateAdmin({
      program,
      isWriteEnabled: false,
      adminAccount: adminAccountKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    await provider.sendAndConfirm(updateAdminTx, [adminKeypair]);
  });

  it("Initializing Content Node accounts!", async function () {
    contentNodes["1"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(1),
    });
    contentNodes["2"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(2),
    });
    contentNodes["3"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(3),
    });
  });

  it("Delete save for a track", async function () {
    const user = await createSolanaUser(program, provider, adminAccountKeypair);

    const tx = deleteTrackSave({
      program,
      baseAuthorityAccount: user.authority,
      adminAccount: adminAccountKeypair.publicKey,
      userAccount: user.accountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityPublicKey: user.keypair.publicKey,
      userId: user.userId,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const txHash = await provider.sendAndConfirm(tx, [user.keypair]);
    const info = await getTransaction(provider, txHash);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userIdSeed = user.userId;
    const instructionUserId = decodedInstruction.data.userIdSeedBump.userId;
    assert.equal(instructionUserId, userIdSeed);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.deleteSave
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Save a newly created track", async function () {
    const user = await createSolanaUser(program, provider, adminAccountKeypair);

    const tx = addTrackSave({
      program,
      baseAuthorityAccount: user.authority,
      adminAccount: adminAccountKeypair.publicKey,
      userAccount: user.accountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityPublicKey: user.keypair.publicKey,
      userId: user.userId,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const txHash = await provider.sendAndConfirm(tx, [user.keypair]);

    const info = await getTransaction(provider, txHash);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userIdSeed = user.userId;
    const instructionUserId = decodedInstruction.data.userIdSeedBump.userId;
    assert.equal(instructionUserId, userIdSeed);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addSave
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Repost a track", async function () {
    const user = await createSolanaUser(program, provider, adminAccountKeypair);

    const tx = addTrackRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminAccount: adminAccountKeypair.publicKey,
      userAccount: user.accountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityPublicKey: user.keypair.publicKey,
      userId: user.userId,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const txHash = await provider.sendAndConfirm(tx, [user.keypair]);

    const info = await getTransaction(provider, txHash);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userIdSeed = user.userId;
    const instructionUserId = decodedInstruction.data.userIdSeedBump.userId;
    assert.equal(instructionUserId, userIdSeed);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Delegate reposts a track", async function () {
    const userDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminAccountKeypair: adminAccountKeypair,
      program,
      provider,
    });

    const tx = addTrackRepost({
      program,
      baseAuthorityAccount: userDelegate.baseAuthorityAccount,
      adminAccount: adminAccountKeypair.publicKey,
      userAccount: userDelegate.userAccountAddress,
      userAuthorityDelegateAccount:
        userDelegate.userAuthorityDelegateAccountAddress,
      authorityDelegationStatusAccount:
        userDelegate.authorityDelegationStatusAccount,
      userAuthorityPublicKey:
        userDelegate.userAuthorityDelegateKeypair.publicKey,
      userId: userDelegate.userId,
      bumpSeed: userDelegate.userBumpSeed,
      id: randomString(10),
    });
    const txHash = await provider.sendAndConfirm(tx, [
      userDelegate.userAuthorityDelegateKeypair,
    ]);
    const info = await getTransaction(provider, txHash);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userIdSeed = userDelegate.userId;
    const instructionUserId = decodedInstruction.data.userIdSeedBump.userId;
    assert.equal(instructionUserId, userIdSeed);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Delete repost for a track", async function () {
    const user = await createSolanaUser(program, provider, adminAccountKeypair);

    const tx = deleteTrackRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminAccount: adminAccountKeypair.publicKey,
      userAccount: user.accountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityPublicKey: user.keypair.publicKey,
      userId: user.userId,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const txHash = await provider.sendAndConfirm(tx, [user.keypair]);

    const info = await getTransaction(provider, txHash);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userIdSeed = user.userId;
    const instructionUserId = decodedInstruction.data.userIdSeedBump.userId;
    assert.equal(instructionUserId, userIdSeed);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.deleteRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });
});
