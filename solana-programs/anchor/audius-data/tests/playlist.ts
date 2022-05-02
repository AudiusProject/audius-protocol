import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { initAdmin, updateAdmin } from "../lib/lib";
import {
  findDerivedPair,
  randomCID,
  randomId,
  convertBNToUserIdSeed,
} from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  testCreatePlaylist,
  createSolanaContentNode,
  initTestConstants,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
  testDeletePlaylist,
  testUpdatePlaylist,
} from "./test-helpers";

const { SystemProgram } = anchor.web3;

chai.use(chaiAsPromised);

describe("playlists", function () {
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
      cn1: contentNodes["1"].accountAddress,
      cn2: contentNodes["2"].accountAddress,
      cn3: contentNodes["3"].accountAddress,
    };
  };
  it("Initializing admin account!", async function () {
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

    const chainAuthority = adminAccount.authority.toString();
    const expectedAuthority = adminKeypair.publicKey.toString();
    expect(chainAuthority, "authority").to.equal(expectedAuthority);
    expect(adminAccount.isWriteEnabled, "is_write_enabled").to.equal(true);
  });

  it("Initializing Content Node accounts!", async function () {
    const cn1 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(1),
    });
    const cn2 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(2),
    });
    const cn3 = await createSolanaContentNode({
      program,
      provider,
      adminKeypair,
      adminAccountKeypair,
      spId: new anchor.BN(3),
    });
    contentNodes["1"] = cn1;
    contentNodes["2"] = cn2;
    contentNodes["3"] = cn3;
  });

  it("Initializing + claiming user, creating + updating playlist", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: userAccountAddress,
    } = await findDerivedPair(
      program.programId,
      adminAccountKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      userId,
      bumpSeed,
      metadata,
      userAccount: userAccountAddress,
      adminAccountKeypair,
      adminKeypair,
      ...getURSMParams(),
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      ethPrivateKey: ethAccount.privateKey,
      newUserPublicKey: newUserKeypair.publicKey,
      userAccount: userAccountAddress,
    });

    const playlistMetadata = randomCID();
    const playlistID = randomId();

    await testCreatePlaylist({
      provider,
      program,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      id: playlistID,
      playlistMetadata,
      userAuthorityKeypair: newUserKeypair,
      playlistOwner: userAccountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      adminAccount: adminAccountKeypair.publicKey,
    });

    // Expected signature validation failure
    const wrongUserKeypair = anchor.web3.Keypair.generate();
    console.log(
      `Expecting error with public key ${wrongUserKeypair.publicKey}`
    );
    try {
      await testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        id: randomId(),
        playlistMetadata,
        userAuthorityKeypair: wrongUserKeypair,
        playlistOwner: userAccountAddress,
        userAuthorityDelegateAccount: SystemProgram.programId,
        authorityDelegationStatusAccount: SystemProgram.programId,
        adminAccount: adminAccountKeypair.publicKey,
      });
    } catch (e) {
      console.log(`Error found as expected ${e}`);
    }
    const updatedPlaylistMetadata = randomCID();
    await testUpdatePlaylist({
      provider,
      program,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      adminAccount: adminAccountKeypair.publicKey,
      id: playlistID,
      userAccount: userAccountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      metadata: updatedPlaylistMetadata,
    });
  });

  it("creating + deleting a playlist", async function () {
    const { ethAccount, metadata, userId } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: userAccountAddress,
    } = await findDerivedPair(
      program.programId,
      adminAccountKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // disable admin writes
    const updateAdminTx = updateAdmin({
      program,
      isWriteEnabled: false,
      adminAccount: adminAccountKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    await provider.sendAndConfirm(updateAdminTx, [adminKeypair]);

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      baseAuthorityAccount,
      ethAccount,
      userId,
      bumpSeed,
      metadata,
      newUserKeypair,
      userAccount: userAccountAddress,
      adminAccount: adminAccountKeypair.publicKey,
      ...getURSMParams(),
    });

    const playlistMetadata = randomCID();
    const playlistID = randomId();

    await testCreatePlaylist({
      provider,
      program,
      id: playlistID,
      baseAuthorityAccount,
      userId,
      adminAccount: adminAccountKeypair.publicKey,
      bumpSeed,
      playlistMetadata,
      userAuthorityKeypair: newUserKeypair,
      playlistOwner: userAccountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
    });

    await testDeletePlaylist({
      provider,
      program,
      id: playlistID,
      playlistOwner: userAccountAddress,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      adminAccount: adminAccountKeypair.publicKey,
    });
  });

  it("create multiple playlists in parallel", async function () {
    const { ethAccount, metadata, userId } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: userAccountAddress,
    } = await findDerivedPair(
      program.programId,
      adminAccountKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // Disable admin writes
    const updateAdminTx = updateAdmin({
      program,
      isWriteEnabled: false,
      adminAccount: adminAccountKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    await provider.sendAndConfirm(updateAdminTx, [adminKeypair]);

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      baseAuthorityAccount,
      ethAccount,
      userId,
      bumpSeed,
      metadata,
      newUserKeypair,
      userAccount: userAccountAddress,
      adminAccount: adminAccountKeypair.publicKey,
      ...getURSMParams(),
    });

    const playlistMetadata = randomCID();
    const playlistMetadata2 = randomCID();
    const playlistMetadata3 = randomCID();
    const start = Date.now();
    await Promise.all([
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        adminAccount: adminAccountKeypair.publicKey,
        id: randomId(),
        playlistMetadata,
        userAuthorityKeypair: newUserKeypair,
        playlistOwner: userAccountAddress,
        userAuthorityDelegateAccount: SystemProgram.programId,
        authorityDelegationStatusAccount: SystemProgram.programId,
      }),
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        adminAccount: adminAccountKeypair.publicKey,
        id: randomId(),
        playlistMetadata: playlistMetadata2,
        userAuthorityKeypair: newUserKeypair,
        playlistOwner: userAccountAddress,
        userAuthorityDelegateAccount: SystemProgram.programId,
        authorityDelegationStatusAccount: SystemProgram.programId,
      }),
      testCreatePlaylist({
        provider,
        program,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        adminAccount: adminAccountKeypair.publicKey,
        id: randomId(),
        playlistMetadata: playlistMetadata3,
        userAuthorityKeypair: newUserKeypair,
        playlistOwner: userAccountAddress,
        userAuthorityDelegateAccount: SystemProgram.programId,
        authorityDelegationStatusAccount: SystemProgram.programId,
      }),
    ]);
    console.log(`Created 3 playlists in ${Date.now() - start}ms`);
  });
});
