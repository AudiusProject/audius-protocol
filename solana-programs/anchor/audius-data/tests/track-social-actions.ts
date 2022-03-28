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
import {
  getTransaction,
  randomString,
  SystemSysVarProgramKey,
} from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import { createSolanaContentNode, createSolanaUser, testCreateUserDelegate } from "./test-helpers";
const { SystemProgram } = anchor.web3;

chai.use(chaiAsPromised);

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

describe("track-actions", function () {
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

  it("track actions - Initializing admin account!", async function () {
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

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });
  });

  it("Initializing Content Node accounts!", async function () {
    contentNodes["1"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(1),
    });
    contentNodes["2"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(2),
    });
    contentNodes["3"] = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStorageKeypair,
      spId: new anchor.BN(3),
    });
  });

  it("Delete save for a track", async function () {
    const user = await createSolanaUser(program, provider, adminStorageKeypair);

    const tx = await deleteTrackSave({
      program,
      baseAuthorityAccount: user.authority,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      userStorageAccountPDA: user.pda,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const info = await getTransaction(provider, tx);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userHandle = String.fromCharCode(...user.handleBytesArray);
    const instructionHandle = String.fromCharCode(
      ...decodedInstruction.data.userHandle.seed
    );
    assert.equal(instructionHandle, userHandle);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.deleteSave
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Save a newly created track", async function () {
    const user = await createSolanaUser(program, provider, adminStorageKeypair);

    const tx = await addTrackSave({
      program,
      baseAuthorityAccount: user.authority,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      userStorageAccountPDA: user.pda,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const info = await getTransaction(provider, tx);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userHandle = String.fromCharCode(...user.handleBytesArray);
    const instructionHandle = String.fromCharCode(
      ...decodedInstruction.data.userHandle.seed
    );
    assert.equal(instructionHandle, userHandle);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addSave
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Repost a track", async function () {
    const user = await createSolanaUser(program, provider, adminStorageKeypair);

    const tx = await addTrackRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      userStorageAccountPDA: user.pda,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });
    const info = await getTransaction(provider, tx);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userHandle = String.fromCharCode(...user.handleBytesArray);
    const instructionHandle = String.fromCharCode(
      ...decodedInstruction.data.userHandle.seed
    );
    assert.equal(instructionHandle, userHandle);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Delegate reposts a track", async function () {
    const delegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStorageKeypair,
      program,
      provider,
      ...getURSMParams(),
    });

    const tx = await addTrackRepost({
      program,
      baseAuthorityAccount: delegate.baseAuthorityAccount,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      userStorageAccountPDA: delegate.userAccountPDA,
      userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccountPDA:
        delegate.authorityDelegationStatusPDA,
      userAuthorityKeypair: delegate.userAuthorityDelegateKeypair,
      handleBytesArray: delegate.handleBytesArray,
      bumpSeed: delegate.userBumpSeed,
      id: randomString(10),
    });
    const info = await getTransaction(provider, tx);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userHandle = String.fromCharCode(...delegate.handleBytesArray);
    const instructionHandle = String.fromCharCode(
      ...decodedInstruction.data.userHandle.seed
    );
    assert.equal(instructionHandle, userHandle);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.addRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });

  it("Delete repost for a track", async function () {
    const user = await createSolanaUser(program, provider, adminStorageKeypair);

    const tx = await deleteTrackRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      userStorageAccountPDA: user.pda,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      id: randomString(10),
    });

    const info = await getTransaction(provider, tx);
    const instructionCoder = program.coder.instruction as BorshInstructionCoder;
    const decodedInstruction = instructionCoder.decode(
      info.transaction.message.instructions[0].data,
      "base58"
    );
    const userHandle = String.fromCharCode(...user.handleBytesArray);
    const instructionHandle = String.fromCharCode(
      ...decodedInstruction.data.userHandle.seed
    );
    assert.equal(instructionHandle, userHandle);
    expect(decodedInstruction.data.entitySocialAction).to.deep.equal(
      EntitySocialActionEnumValues.deleteRepost
    );
    expect(decodedInstruction.data.entityType).to.deep.equal(
      EntityTypesEnumValues.track
    );
  });
});
