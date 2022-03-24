import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  initAdmin,
  updateUser,
  updateAdmin,
  updateIsVerified,
  getKeypairFromSecretKey,
} from "../lib/lib";
import {
  getTransactionWithData,
  findDerivedPair,
  findProgramAddress,
  randomCID,
  randomString,
} from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  testCreateTrack,
  testInitDelegate,
  confirmLogInTransaction,
  initTestConstants,
  pollAccountBalance,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
  testDeleteTrack,
  testUpdateTrack,
  testCreateUserDelegate,
} from "./test-helpers";
const { PublicKey, SystemProgram } = anchor.web3;

chai.use(chaiAsPromised);

describe("audius-data", function () {
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
    const tx = await initAdmin({
      provider,
      program,
      adminKeypair,
      adminStgKeypair,
      verifierKeypair,
    });

    const { decodedInstruction, decodedData, accountPubKeys } =
      await getTransactionWithData(program, provider, tx, 0);

    expect(decodedInstruction.name).to.equal("initAdmin");
    expect(decodedData.authority.toString()).to.equal(
      adminKeypair.publicKey.toString()
    );
    expect(decodedData.verifier.toString()).to.equal(
      verifierKeypair.publicKey.toString()
    );
    expect(accountPubKeys[0]).to.equal(adminStgKeypair.publicKey.toString());
    expect(accountPubKeys[2]).to.equal(SystemProgram.programId.toString());

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStgKeypair.publicKey
    );

    const chainAuthority = adminAccount.authority.toString();
    const expectedAuthority = adminKeypair.publicKey.toString();
    expect(chainAuthority, "authority").to.equal(expectedAuthority);
    expect(adminAccount.isWriteEnabled, "is_write_enabled").to.equal(true);
  });

  it("Initializing user!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });
  });

  it("Initializing + claiming user!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();
    const keypairFromSecretKey = await getKeypairFromSecretKey(
      newUserKeypair.secretKey
    );

    expect(newUserKeypair.publicKey.toString()).to.equal(
      keypairFromSecretKey.publicKey.toString()
    );
    expect(newUserKeypair.secretKey.toString()).to.equal(
      keypairFromSecretKey.secretKey.toString()
    );

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = keypairFromSecretKey.publicKey.toBytes();

    await testInitUserSolPubkey({
      provider,
      program,
      message,
      ethPrivateKey: ethAccount.privateKey,
      newUserPublicKey: keypairFromSecretKey.publicKey,
      newUserAcctPDA,
    });
  });

  it("Initializing + claiming user with bad message should fail!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = anchor.web3.Keypair.generate().publicKey.toBytes();

    await expect(
      testInitUserSolPubkey({
        provider,
        program,
        message,
        ethPrivateKey: ethAccount.privateKey,
        newUserPublicKey: newUserKeypair.publicKey,
        newUserAcctPDA,
      })
    ).to.be.rejectedWith(Error);
  });

  it("Initializing + claiming + updating user!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
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
      newUserAcctPDA,
    });

    const updatedCID = randomCID();
    const tx = await updateUser({
      program,
      metadata: updatedCID,
      userStgAccount: newUserAcctPDA,
      userAuthorityKeypair: newUserKeypair,
      // No delegate authority needs to be provided in this happy path, so use the SystemProgram ID
      userAuthorityDelegate: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
    });

    const { decodedInstruction, decodedData, accountPubKeys } =
      await getTransactionWithData(program, provider, tx, 0);

    expect(decodedInstruction.name).to.equal("updateUser");
    expect(decodedData.metadata).to.equal(updatedCID);

    expect(accountPubKeys[0]).to.equal(newUserAcctPDA.toString());
    expect(accountPubKeys[1]).to.equal(newUserKeypair.publicKey.toString());
    expect(accountPubKeys[2]).to.equal(SystemProgram.programId.toString());
  });

  it("Initializing + claiming user, creating + updating track", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
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
      newUserAcctPDA,
    });

    const trackMetadata = randomCID();
    const trackID = randomString(10);

    await testCreateTrack({
      provider,
      program,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      id: trackID,
      trackMetadata,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      adminStgAccount: adminStgKeypair.publicKey,
    });

    // Expected signature validation failure
    const wrongUserKeypair = anchor.web3.Keypair.generate();
    console.log(
      `Expecting error with public key ${wrongUserKeypair.publicKey}`
    );
    try {
      await testCreateTrack({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        id: randomString(10),
        trackMetadata,
        userAuthorityKeypair: wrongUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        adminStgAccount: adminStgKeypair.publicKey,
      });
    } catch (e) {
      console.log(`Error found as expected ${e}`);
    }
    const updatedTrackMetadata = randomCID();
    await testUpdateTrack({
      provider,
      program,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      adminStgAccount: adminStgKeypair.publicKey,
      id: trackID,
      userStgAccountPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      metadata: updatedTrackMetadata,
    });
  });

  it("Creating user with admin writes enabled should fail", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // enable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: true,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      })
    ).to.be.rejectedWith(Error);
  });

  it("Creating user with bad message should fail!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = anchor.web3.Keypair.generate().publicKey.toBytes();

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      })
    ).to.be.rejectedWith(Error);
  });

  it("Creating user!", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
      );
  });

  it("Adding/removing delegate authority (update user)", async function () {
    const delegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    const acctState = await program.account.userAuthorityDelegate.fetch(
      delegate.userAuthorityDelegatePDA
    );
    const userStgPdaFromChain = acctState.userStorageAccount;
    const delegateAuthorityFromChain = acctState.delegateAuthority;
    expect(userStgPdaFromChain.toString(), "user stg pda").to.equal(
      delegate.userAccountPDA.toString()
    );
    expect(
      delegate.userAuthorityDelegateKeypair.publicKey.toString(),
      "del auth pda"
    ).to.equal(delegateAuthorityFromChain.toString());
    const updatedCID = randomCID();
    await updateUser({
      program,
      metadata: updatedCID,
      userStgAccount: delegate.userAccountPDA,
      userAuthorityKeypair: delegate.userAuthorityDelegateKeypair,
      userAuthorityDelegate: delegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccount: delegate.authorityDelegationStatusPDA,
    });
    const removeUserAuthorityDelegateArgs = {
      accounts: {
        admin: adminStgKeypair.publicKey,
        user: delegate.userAccountPDA,
        newUserAuthorityDelegate: delegate.userAuthorityDelegatePDA,
        signerUserAuthorityDelegate: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatus: delegate.authorityDelegationStatusPDA,
        authority: delegate.newUserKeypair.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [delegate.newUserKeypair],
    };

    await program.rpc.removeUserAuthorityDelegate(
      delegate.baseAuthorityAccount,
      delegate.handleBytesArray,
      delegate.userBumpSeed,
      delegate.userAuthorityDelegateKeypair.publicKey,
      delegate.userAuthorityDelegateBump,
      removeUserAuthorityDelegateArgs
    );

    // Confirm account deallocated after removal
    await pollAccountBalance(
      provider,
      delegate.userAuthorityDelegatePDA,
      0,
      100
    );
    await expect(
      updateUser({
        program,
        metadata: randomCID(),
        userStgAccount: delegate.userAccountPDA,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair,
        userAuthorityDelegate: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccount: delegate.authorityDelegationStatusPDA,
      })
    )
      .to.eventually.be.rejected.and.property("msg")
      .to.include(`No 8 byte discriminator was found on the account`);
  });

  it("Revoking authority delegation status", async function () {
    const delegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    const acctState = await program.account.userAuthorityDelegate.fetch(
      delegate.userAuthorityDelegatePDA
    );
    const userStgPdaFromChain = acctState.userStorageAccount;
    const delegateAuthorityFromChain = acctState.delegateAuthority;
    expect(userStgPdaFromChain.toString(), "user stg pda").to.equal(
      delegate.userAccountPDA.toString()
    );
    expect(
      delegate.userAuthorityDelegateKeypair.publicKey.toString(),
      "del auth pda"
    ).to.equal(delegateAuthorityFromChain.toString());
    const updatedCID = randomCID();
    await updateUser({
      program,
      metadata: updatedCID,
      userStgAccount: delegate.userAccountPDA,
      userAuthorityKeypair: delegate.userAuthorityDelegateKeypair,
      userAuthorityDelegate: delegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccount: delegate.authorityDelegationStatusPDA,
    });

    // revoke authority delegation
    const revokeAuthorityDelegationArgs = {
      accounts: {
        delegateAuthority: delegate.userAuthorityDelegateKeypair.publicKey,
        authorityDelegationStatusPda: delegate.authorityDelegationStatusPDA,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [delegate.userAuthorityDelegateKeypair],
    };

    await program.rpc.revokeAuthorityDelegation(
      delegate.authorityDelegationStatusBump,
      revokeAuthorityDelegationArgs
    );

    // Confirm revoked delegation cannot update user
    await expect(
      updateUser({
        program,
        metadata: randomCID(),
        userStgAccount: delegate.userAccountPDA,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair,
        userAuthorityDelegate: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccount: delegate.authorityDelegationStatusPDA,
      })
    )
      .to.eventually.be.rejected.and.property("msg")
      .to.include(`This authority's delegation status is revoked.`);
  });

  it("delegate adds/removes another delegate", async function () {
    const firstDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    const secondDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    const userAuthorityDelegateSeeds = [
      firstDelegate.userAccountPDA.toBytes().slice(0, 32),
      secondDelegate.userAuthorityDelegateKeypair.publicKey
        .toBytes()
        .slice(0, 32),
    ];
    const res = await PublicKey.findProgramAddress(
      userAuthorityDelegateSeeds,
      program.programId
    );
    const newUserAuthorityDelegatePDA = res[0];
    const newUserAuthorityDelegateBump = res[1];

    const addUserAuthorityDelegateArgs = {
      accounts: {
        admin: adminStgKeypair.publicKey,
        user: firstDelegate.userAccountPDA,
        newUserAuthorityDelegate: newUserAuthorityDelegatePDA,
        signerUserAuthorityDelegate: firstDelegate.userAuthorityDelegatePDA,
        authorityDelegationStatus: firstDelegate.authorityDelegationStatusPDA,
        authority: firstDelegate.userAuthorityDelegateKeypair.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [firstDelegate.userAuthorityDelegateKeypair], // the first user's delegate signs
    };

    await program.rpc.addUserAuthorityDelegate(
      firstDelegate.baseAuthorityAccount,
      firstDelegate.handleBytesArray,
      firstDelegate.userBumpSeed,
      secondDelegate.userAuthorityDelegateKeypair.publicKey, // seed for userAuthorityDelegatePda
      addUserAuthorityDelegateArgs
    );

    const removeUserAuthorityDelegateArgs = {
      accounts: {
        admin: adminStgKeypair.publicKey,
        user: firstDelegate.userAccountPDA,
        newUserAuthorityDelegate: newUserAuthorityDelegatePDA,
        signerUserAuthorityDelegate: firstDelegate.userAuthorityDelegatePDA,
        authorityDelegationStatus: firstDelegate.authorityDelegationStatusPDA,
        authority: firstDelegate.userAuthorityDelegateKeypair.publicKey,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [firstDelegate.userAuthorityDelegateKeypair],
    };

    await program.rpc.removeUserAuthorityDelegate(
      firstDelegate.baseAuthorityAccount,
      firstDelegate.handleBytesArray,
      firstDelegate.userBumpSeed,
      secondDelegate.userAuthorityDelegateKeypair.publicKey, // seed for userAuthorityDelegatePda
      newUserAuthorityDelegateBump,
      removeUserAuthorityDelegateArgs
    );
  });

  it("creating initialized user should fail", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await testInitUser({
      provider,
      program,
      baseAuthorityAccount,
      ethAddress: ethAccount.address,
      handleBytesArray,
      bumpSeed,
      metadata,
      userStgAccount: newUserAcctPDA,
      adminStgKeypair,
      adminKeypair,
    });

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: newUserAcctPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
      );
  });

  it("creating user with incorrect bump seed / pda should fail", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    const { handleBytesArray: incorrectHandleBytesArray } = initTestConstants();

    const { derivedAddress: incorrectPDA } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(incorrectHandleBytesArray)
    );

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStgAccount: incorrectPDA,
        adminStgPublicKey: adminStgKeypair.publicKey,
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Program ${program.programId.toString()} failed: Cross-program invocation with unauthorized signer or writable account`
      );
  });

  it("Verify user", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    await testCreateUser({
      provider,
      program,
      message,
      ethAccount,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });
    const tx = await updateIsVerified({
      program,
      adminKeypair: adminStgKeypair,
      userStgAccount: newUserAcctPDA,
      verifierKeypair,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
    });

    await confirmLogInTransaction(provider, tx, "success");
  });

  it("creating + deleting a track", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });
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
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    const trackMetadata = randomCID();
    const trackID = randomString(10);

    await testCreateTrack({
      provider,
      program,
      id: trackID,
      baseAuthorityAccount,
      handleBytesArray,
      adminStgAccount: adminStgKeypair.publicKey,
      bumpSeed,
      trackMetadata,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
    });

    await testDeleteTrack({
      provider,
      program,
      id: trackID,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      baseAuthorityAccount,
      handleBytesArray,
      bumpSeed,
      adminStgAccount: adminStgKeypair.publicKey,
    });
  });

  it("delegate creates a track (manage entity) + all validation errors", async function () {
    // create user and delegate
    const delegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    // create track with delegate
    const trackMetadata = randomCID();
    const trackID = randomString(10);

    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId, // missing PDA
        authorityDelegationStatusAccountPDA:
          delegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: SystemProgram.programId, // missing PDA
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA:
          delegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA:
          delegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // use different user authority delegate PDA
    const badDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStgKeypair,
      program,
      provider,
    });

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: badDelegate.userAuthorityDelegatePDA, // mismatched PDA
        authorityDelegationStatusAccountPDA:
          delegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // use different authority delegation status PDA

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: delegate.baseAuthorityAccount,
        handleBytesArray: delegate.handleBytesArray,
        adminStgAccount: adminStgKeypair.publicKey,
        bumpSeed: delegate.userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: delegate.userAccountPDA,
        userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA:
          badDelegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await testCreateTrack({
      provider,
      program,
      id: trackID,
      baseAuthorityAccount: delegate.baseAuthorityAccount,
      handleBytesArray: delegate.handleBytesArray,
      adminStgAccount: adminStgKeypair.publicKey,
      bumpSeed: delegate.userBumpSeed,
      trackMetadata,
      userAuthorityKeypair: delegate.userAuthorityDelegateKeypair, // substitute delegate
      trackOwnerPDA: delegate.userAccountPDA,
      userAuthorityDelegateAccountPDA: delegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccountPDA:
        delegate.authorityDelegationStatusPDA,
    });
  });

  it("create multiple tracks in parallel", async function () {
    const { ethAccount, handleBytesArray, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    );

    // Disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStgAccount: adminStgKeypair.publicKey,
      adminAuthorityKeypair: adminKeypair,
    });

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
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStgAccount: newUserAcctPDA,
      adminStgPublicKey: adminStgKeypair.publicKey,
    });

    const trackMetadata = randomCID();
    const trackMetadata2 = randomCID();
    const trackMetadata3 = randomCID();
    const start = Date.now();
    await Promise.all([
      testCreateTrack({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        trackMetadata,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
      }),
      testCreateTrack({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        trackMetadata: trackMetadata2,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
      }),
      testCreateTrack({
        provider,
        program,
        baseAuthorityAccount,
        handleBytesArray,
        bumpSeed,
        adminStgAccount: adminStgKeypair.publicKey,
        id: randomString(10),
        trackMetadata: trackMetadata3,
        userAuthorityKeypair: newUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
      }),
    ]);
    console.log(`Created 3 tracks in ${Date.now() - start}ms`);
  });
});
