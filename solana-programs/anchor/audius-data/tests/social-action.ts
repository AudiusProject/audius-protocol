import * as anchor from "@project-serum/anchor";
import { BorshInstructionCoder, Program } from "@project-serum/anchor";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  initAdmin,
  saveTrack,
  TrackActionEnumValues,
  updateAdmin,
} from "../lib/lib";
import { getTransaction } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import { createSolanaUser, createSolanaTrack } from "./test-helpers";

chai.use(chaiAsPromised);

describe("social-actions", function () {
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

  it("social actions - Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
      trackIdOffset: new anchor.BN("10"),
      playlistIdOffset: new anchor.BN("0"),
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

  it("Save a track with a low track id", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);
    const tx = await saveTrack({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      trackAction: TrackActionEnumValues.save,
      trackId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.trackAction).to.deep.equal(
      TrackActionEnumValues.save
    );
  });

  it("Unsave a track", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const tx = await saveTrack({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      trackAction: TrackActionEnumValues.unsave,
      trackId: new anchor.BN("1"),
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
    expect(decodedInstruction.data.trackAction).to.deep.equal(
      TrackActionEnumValues.unsave
    );
  });

  it("Save a newly created track", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const track = await createSolanaTrack(
      program,
      provider,
      adminStgKeypair,
      user.keypair,
      user.pda
    );

    const tx = await saveTrack({
      program,
      baseAuthorityAccount: user.authority,
      adminStgPublicKey: adminStgKeypair.publicKey,
      userStgAccountPDA: user.pda,
      userAuthorityKeypair: user.keypair,
      handleBytesArray: user.handleBytesArray,
      bumpSeed: user.bumpSeed,
      trackAction: TrackActionEnumValues.save,
      trackId: track.track.trackId,
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
    expect(decodedInstruction.data.trackAction).to.deep.equal(
      TrackActionEnumValues.save
    );
  });

  it("Error on saving an invalid track", async function () {
    const user = await createSolanaUser(program, provider, adminStgKeypair);

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    await expect(
      saveTrack({
        program,
        baseAuthorityAccount: user.authority,
        adminStgPublicKey: adminStgKeypair.publicKey,
        userStgAccountPDA: user.pda,
        userAuthorityKeypair: user.keypair,
        handleBytesArray: user.handleBytesArray,
        bumpSeed: user.bumpSeed,
        trackAction: TrackActionEnumValues.unsave,
        trackId: adminAccount.trackId,
      })
    )
      .to.eventually.be.rejected.and.property("msg")
      .to.include(`Invalid Id.`);
  });
});
