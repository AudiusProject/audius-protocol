import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  createPlaylist,
  deletePlaylist,
  initAdmin,
  updateAdmin,
  updatePlaylist,
} from "../lib/lib";
import { findDerivedPair, randomCID } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  confirmLogInTransaction,
  initTestConstants,
  testCreateUser,
} from "./test-helpers";

describe("playlist", function () {
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

  it("Initializing admin account!", async function () {
    await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
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
  });

  describe("create, update, delete", function () {
    const testCreatePlaylist = async ({
      newPlaylistKeypair,
      playlistOwnerPDA,
      userAuthorityKeypair,
      adminStgKeypair,
      playlistMetadata,
    }) => {
      const tx = await createPlaylist({
        provider,
        program,
        newPlaylistKeypair,
        userStgAccountPDA: playlistOwnerPDA,
        userAuthorityKeypair: userAuthorityKeypair,
        adminStgPublicKey: adminStgKeypair.publicKey,
        metadata: playlistMetadata,
      });
      await confirmLogInTransaction(provider, tx, playlistMetadata);
      const createdPlaylist = await program.account.playlist.fetch(
        newPlaylistKeypair.publicKey
      );
      console.log(
        `playlist: ${playlistMetadata}, playlistId assigned = ${createdPlaylist.playlistId}`
      );
    };

    const testUpdatePlaylist = async ({
      playlistKeypair,
      playlistOwnerPDA,
      userAuthorityKeypair,
      playlistMetadata,
    }) => {
      const tx = await updatePlaylist({
        program,
        playlistPublicKey: playlistKeypair.publicKey,
        userStgAccountPDA: playlistOwnerPDA,
        userAuthorityKeypair,
        metadata: playlistMetadata,
      });
      await confirmLogInTransaction(provider, tx, playlistMetadata);
    };

    const testDeletePlaylist = async ({
      playlistKeypair,
      playlistOwnerPDA,
      userAuthorityKeypair,
    }) => {
      const initialPlaylistAcctBalance = await provider.connection.getBalance(
        playlistKeypair.publicKey
      );
      const initialPayerBalance = await provider.connection.getBalance(
        provider.wallet.publicKey
      );

      await deletePlaylist({
        provider,
        program,
        playlistPublicKey: playlistKeypair.publicKey,
        userStgAccountPDA: playlistOwnerPDA,
        userAuthorityKeypair,
      });

      // Confirm that the account is zero'd out
      // Note that there appears to be a delay in the propagation, hence the retries
      let playlistAcctBalance = initialPlaylistAcctBalance;
      let payerBalance = initialPayerBalance;
      let retries = 100;
      while (playlistAcctBalance > 0 && retries > 0) {
        playlistAcctBalance = await provider.connection.getBalance(
          playlistKeypair.publicKey
        );
        payerBalance = await provider.connection.getBalance(
          provider.wallet.publicKey
        );
        retries--;
      }

      if (playlistAcctBalance > 0) {
        throw new Error(
          `Failed to deallocate playlist - Remaining balance ${playlistAcctBalance}`
        );
      }

      console.log(
        `Playlist acct lamports ${initialPlaylistAcctBalance} -> ${playlistAcctBalance}`
      );
      console.log(
        `Payer acct lamports ${initialPayerBalance} -> ${payerBalance}`
      );
    };

    let newUserAcctPDA: anchor.web3.PublicKey;
    let newUserKeypair: anchor.web3.Keypair;

    // Initialize user for each test
    beforeEach(async function () {
      const { ethAccount, handleBytesArray, metadata } = initTestConstants();

      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          program.programId,
          adminStgKeypair.publicKey,
          Buffer.from(handleBytesArray)
        );

      newUserAcctPDA = derivedAddress;

      // New sol key that will be used to permission user updates
      newUserKeypair = anchor.web3.Keypair.generate();

      // Generate signed SECP instruction
      // Message as the incoming public key
      const message = newUserKeypair.publicKey.toBytes();

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
        message,
        baseAuthorityAccount,
        ethAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      });
    });

    it("create playlist", async function () {
      await testCreatePlaylist({
        newPlaylistKeypair: anchor.web3.Keypair.generate(),
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        adminStgKeypair,
        playlistMetadata: randomCID(),
      });
    });

    it("update playlist", async function () {
      const newPlaylistKeypair = anchor.web3.Keypair.generate();

      await testCreatePlaylist({
        newPlaylistKeypair,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        adminStgKeypair,
        playlistMetadata: randomCID(),
      });

      await testUpdatePlaylist({
        playlistKeypair: newPlaylistKeypair,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        playlistMetadata: randomCID(),
      });
    });

    it("delete playlist", async function () {
      const newPlaylistKeypair = anchor.web3.Keypair.generate();

      await testCreatePlaylist({
        newPlaylistKeypair,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        adminStgKeypair,
        playlistMetadata: randomCID(),
      });

      await testDeletePlaylist({
        playlistKeypair: newPlaylistKeypair,
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
      });
    });
  });
});
