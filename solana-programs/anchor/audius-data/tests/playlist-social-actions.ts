import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Program } from "@project-serum/anchor";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  initAdmin,
  writePlaylistSocialAction,
  PlaylistSocialActionEnumValues,
  updateAdmin,
} from "../lib/lib";
import { getTransaction } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import { createSolanaUser, createSolanaPlaylist } from "./test-helpers";

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

  it("playlist actions - Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
      trackIdOffset: new anchor.BN("0"),
      playlistIdOffset: new anchor.BN("10"),
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

  it("Save a playlist with a low playlist id", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);
    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.addSave,
      playlistId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.addSave
    );
  });

  it("Delete save for a playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.deleteSave,
      playlistId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.deleteSave
    );
  });

  it("Save a newly created playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const playlist = await createSolanaPlaylist(
      program,
      provider,
      adminStgKeypair,
      user.keypair,
      user.pda
    );

    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.addSave,
      playlistId: playlist.playlist.playlistId,
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.addSave
    );
  });

  it("Error on saving an invalid playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    await expect(
      writePlaylistSocialAction({
        program,
        baseAuthorityAccount: user.authority,
        adminStgPublicKey: adminStgKeypair.publicKey,
        userStgAccountPDA: user.pda,
        userAuthorityKeypair: user.keypair,
        handleBytesArray: user.handleBytesArray,
        bumpSeed: user.bumpSeed,
        playlistSocialAction: PlaylistSocialActionEnumValues.deleteSave,
        playlistId: adminAccount.playlistId,
      })
    )
      .to.eventually.be.rejected.and.property("msg")
      .to.include(`Invalid Id.`);
  });

  it("Repost a playlist with a low playlist id", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);
    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.addRepost,
      playlistId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.addRepost
    );
  });

  it("Delete repost for a playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.deleteRepost,
      playlistId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.deleteRepost
    );
  });

  it("Repost a newly created playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const playlist = await createSolanaPlaylist(
      program,
      provider,
      adminStgKeypair,
      user.keypair,
      user.pda
    );

    const tx = await writePlaylistSocialAction({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      playlistSocialAction: PlaylistSocialActionEnumValues.addRepost,
      playlistId: playlist.playlist.playlistId,
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
    expect(decodedInstruction.data.playlistSocialAction).to.deep.equal(
      PlaylistSocialActionEnumValues.addRepost
    );
  });

  it("Error on reposting an invalid playlist", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    await expect(
      writePlaylistSocialAction({
        program,
        baseAuthorityAccount: user.authority,
        adminStgPublicKey: adminStgKeypair.publicKey,
        userStgAccountPDA: user.pda,
        userAuthorityKeypair: user.keypair,
        handleBytesArray: user.handleBytesArray,
        bumpSeed: user.bumpSeed,
        playlistSocialAction: PlaylistSocialActionEnumValues.deleteRepost,
        playlistId: adminAccount.playlistId,
      })
    )
      .to.eventually.be.rejected.and.property("msg")
      .to.include(`Invalid Id.`);
  });
});
