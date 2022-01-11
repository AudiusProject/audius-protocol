import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  createPlaylist, deletePlaylist, initAdmin, initUserSolPubkey,
  updatePlaylist
} from "../lib/lib";
import { findDerivedPair, getTransaction, randomCID } from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import { confirmLogInTransaction, initTestConstants, testInitUser } from "./test-helpers";

describe("playlist", () => {
  const provider = anchor.Provider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  let adminKeypair = anchor.web3.Keypair.generate();
  let adminStgKeypair = anchor.web3.Keypair.generate();

  const testInitUserSolPubkey = async ({
    message,
    pkString,
    newUserKeypair,
    newUserAcctPDA,
  }) => {
    let initUserTx = await initUserSolPubkey({
      provider,
      program,
      privateKey: pkString,
      message,
      userSolPubkey: newUserKeypair.publicKey,
      userStgAccount: newUserAcctPDA,
    });

    let userDataFromChain = await program.account.user.fetch(newUserAcctPDA);
    if (!newUserKeypair.publicKey.equals(userDataFromChain.authority)) {
      throw new Error("Unexpected public key found");
    }
    let txInfo = await getTransaction(provider, initUserTx);
    let fee = txInfo["meta"]["fee"];
    console.log(`initUser tx = ${initUserTx} fee = ${fee}`);
  };

  it("Initializing admin account!", async () => {
    await initAdmin({
      provider: provider,
      program: program,
      adminKeypair: adminKeypair,
      adminStgKeypair: adminStgKeypair,
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

  describe('create, update, delete', () => {
    const testCreatePlaylist = async ({
      newPlaylistKeypair,
      playlistOwnerPDA,
      userAuthorityKeypair,
      adminStgKeypair,
      playlistMetadata
    }) => {
      const tx = await createPlaylist({
        provider,
        program,
        newPlaylistKeypair,
        userStgAccountPDA: playlistOwnerPDA,
        userAuthorityKeypair: userAuthorityKeypair,
        adminStgPublicKey: adminStgKeypair.publicKey,
        metadata: playlistMetadata
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
      playlistMetadata
    }) => {
      const tx = await updatePlaylist({
        provider,
        program,
        playlistPublicKey: playlistKeypair.publicKey,
        userStgAccountPDA: playlistOwnerPDA,
        userAuthorityKeypair,
        metadata: playlistMetadata
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

      const tx = await deletePlaylist({
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
      let retries = 20;
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
        throw new Error("Failed to deallocate track");
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
    beforeEach(async () => {
      const {
        pkString,
        testEthAddr,
        testEthAddrBytes,
        handleBytesArray,
        metadata
      } = initTestConstants();

      const { baseAuthorityAccount, bumpSeed, derivedAddress } =
        await findDerivedPair(
          program.programId,
          adminStgKeypair.publicKey,
          Buffer.from(handleBytesArray)
        );
      newUserAcctPDA = derivedAddress;

      await testInitUser(
        provider,
        program,
        baseAuthorityAccount,
        testEthAddr,
        testEthAddrBytes,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserAcctPDA,
        adminStgKeypair,
        adminKeypair,
      );

      // New sol key that will be used to permission user updates
      newUserKeypair = anchor.web3.Keypair.generate();

      // Generate signed SECP instruction
      // Message as the incoming public key
      const message = newUserKeypair.publicKey.toString();

      await testInitUserSolPubkey({
        message,
        pkString,
        newUserKeypair,
        newUserAcctPDA,
      });
    });

    it('create playlist', async () => {
      await testCreatePlaylist({
        newPlaylistKeypair: anchor.web3.Keypair.generate(),
        userAuthorityKeypair: newUserKeypair,
        playlistOwnerPDA: newUserAcctPDA,
        adminStgKeypair,
        playlistMetadata: randomCID(),
      });
    });

    it('update playlist', async () => {
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

    it('delete playlist', async () => {
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
