import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Program } from "@project-serum/anchor";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  initAdmin,
  addPlaylistRepost,
  addPlaylistSave,
  updateAdmin,
  deletePlaylistSave,
  EntitySocialActionEnumValues,
  EntityTypesEnumValues,
  deletePlaylistRepost,
} from "../lib/lib";
import { getTransaction, randomString } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  createSolanaUser,
  createSolanaContentNode,
} from "./test-helpers";

chai.use(chaiAsPromised);

describe("playlist-actions", function () {
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
  const contentNodes = {};

  it("playlist actions - Initializing admin account!", async function () {
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

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });
  });

  it("Initializing Content Node accounts!", async function () {
    const cn1 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(1),
    });
    const cn2 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(2),
    });
    const cn3 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminStgKeypair,
      spId: new anchor.BN(3),
    });
    contentNodes["1"] = cn1;
    contentNodes["2"] = cn2;
    contentNodes["3"] = cn3;
  });

  it("Delete save for a playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await deletePlaylistSave({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
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
      EntityTypesEnumValues.playlist
    );
  });

  it("Save a newly created playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await addPlaylistSave({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
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
      EntityTypesEnumValues.playlist
    );
  });

  it("Repost a playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await addPlaylistRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
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
      EntityTypesEnumValues.playlist
    );
  });

  it("Delete repost for a playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await deletePlaylistRepost({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
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
      EntityTypesEnumValues.playlist
    );
  });
});
