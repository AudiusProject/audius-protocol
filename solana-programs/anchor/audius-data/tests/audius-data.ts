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
  revokeAuthorityDelegation,
  addUserAuthorityDelegate,
  removeUserAuthorityDelegate,
  initAuthorityDelegationStatus,
} from "../lib/lib";
import {
  getTransactionWithData,
  findDerivedPair,
  randomCID,
  randomId,
  convertBNToUserIdSeed,
} from "../lib/utils";
import { AudiusData } from "../target/types/audius_data";
import {
  testCreateTrack,
  confirmLogInTransaction,
  initTestConstants,
  pollAccountBalance,
  testCreateUser,
  testInitUser,
  testInitUserSolPubkey,
  testDeleteTrack,
  testUpdateTrack,
  testCreateUserDelegate,
  createSolanaContentNode,
} from "./test-helpers";
const { PublicKey, SystemProgram } = anchor.web3;

chai.use(chaiAsPromised);

describe("audius-data", function () {
  const provider = anchor.AnchorProvider.local("http://localhost:8899", {
    preflightCommitment: "confirmed",
    commitment: "confirmed",
  });
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

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

  it("Initializing admin account!", async function () {
    const tx = initAdmin({
      payer: provider.wallet.publicKey,
      program,
      adminKeypair,
      adminStorageKeypair,
      verifierKeypair,
    });

    const txSignature = await provider.sendAndConfirm(tx, [
      adminStorageKeypair,
    ]);

    const { decodedInstruction, decodedData, accountPubKeys } =
      await getTransactionWithData(program, provider, txSignature, 0);

    expect(decodedInstruction.name).to.equal("initAdmin");
    expect(decodedData.authority.toString()).to.equal(
      adminKeypair.publicKey.toString()
    );
    expect(decodedData.verifier.toString()).to.equal(
      verifierKeypair.publicKey.toString()
    );
    expect(accountPubKeys[0]).to.equal(
      adminStorageKeypair.publicKey.toString()
    );
    expect(accountPubKeys[2]).to.equal(SystemProgram.programId.toString());

    const adminAccount = await program.account.audiusAdmin.fetch(
      adminStorageKeypair.publicKey
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

  it("Initializing user!", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
      adminKeypair,
      ...getURSMParams(),
    });
  });

  it("Initializing + claiming user!", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
      adminKeypair,
      ...getURSMParams(),
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
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
      adminKeypair,
      ...getURSMParams(),
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
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
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
      newUserAcctPDA,
    });

    const updatedCID = randomCID();
    const tx = await updateUser({
      program,
      metadata: updatedCID,
      userStorageAccount: newUserAcctPDA,
      userAuthorityPublicKey: newUserKeypair.publicKey,
      // No delegate authority needs to be provided in this happy path, so use the SystemProgram ID
      userAuthorityDelegate: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
    });

    const txSignature = await provider.sendAndConfirm(tx, [newUserKeypair]);

    const { decodedInstruction, decodedData, accountPubKeys } =
      await getTransactionWithData(program, provider, txSignature, 0);

    expect(decodedInstruction.name).to.equal("updateUser");
    expect(decodedData.metadata).to.equal(updatedCID);

    expect(accountPubKeys[0]).to.equal(newUserAcctPDA.toString());
    expect(accountPubKeys[1]).to.equal(newUserKeypair.publicKey.toString());
    expect(accountPubKeys[2]).to.equal(SystemProgram.programId.toString());
  });

  it("Initializing + claiming user, creating + updating track", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
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
      newUserAcctPDA,
    });

    const trackMetadata = randomCID();
    const trackID = randomId();

    await testCreateTrack({
      provider,
      program,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      id: trackID,
      trackMetadata,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
        userId,
        bumpSeed,
        id: randomId(),
        trackMetadata,
        userAuthorityKeypair: wrongUserKeypair,
        trackOwnerPDA: newUserAcctPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId,
        authorityDelegationStatusAccountPDA: SystemProgram.programId,
        adminStorageAccount: adminStorageKeypair.publicKey,
      });
    } catch (e) {
      console.log(`Error found as expected ${e}`);
    }
    const updatedTrackMetadata = randomCID();
    await testUpdateTrack({
      provider,
      program,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      adminStorageAccount: adminStorageKeypair.publicKey,
      id: trackID,
      userStorageAccountPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      metadata: updatedTrackMetadata,
    });
  });

  it("Creating user with admin writes enabled should fail", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // enable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: true,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
        userId,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStorageAccount: newUserAcctPDA,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      })
    ).to.be.rejectedWith(Error);
  });

  it("Creating user with bad message should fail!", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
        userId,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStorageAccount: newUserAcctPDA,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      })
    ).to.be.rejectedWith(Error);
  });

  it("Creating user!", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // disable admin writes
    const updateAdminTx = updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
      ethAccount,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStorageAccount: newUserAcctPDA,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      ...getURSMParams(),
    });

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStorageAccount: newUserAcctPDA,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
      );
  });

  it("Adding/removing delegate authority (update user)", async function () {
    const userDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStorageKeypair,
      program,
      provider,
    });

    const acctState = await program.account.userAuthorityDelegate.fetch(
      userDelegate.userAuthorityDelegatePDA
    );
    const userStoragePdaFromChain = acctState.userStorageAccount;
    const delegateAuthorityFromChain = acctState.delegateAuthority;
    expect(userStoragePdaFromChain.toString(), "user storage pda").to.equal(
      userDelegate.userAccountPDA.toString()
    );
    expect(
      userDelegate.userAuthorityDelegateKeypair.publicKey.toString(),
      "del auth pda"
    ).to.equal(delegateAuthorityFromChain.toString());
    const updatedCID = randomCID();
    const updateUserTx = updateUser({
      program,
      metadata: updatedCID,
      userStorageAccount: userDelegate.userAccountPDA,
      userAuthorityPublicKey:
        userDelegate.userAuthorityDelegateKeypair.publicKey,
      userAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccount:
        userDelegate.authorityDelegationStatusPDA,
    });
    await provider.sendAndConfirm(updateUserTx, [
      userDelegate.userAuthorityDelegateKeypair,
    ]);

    const removeUserAuthorityDelegateTx = removeUserAuthorityDelegate({
      program,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      baseAuthorityAccount: userDelegate.baseAuthorityAccount,
      userId: userDelegate.userId,
      userBumpSeed: userDelegate.userBumpSeed,
      user: userDelegate.userAccountPDA,
      currentUserAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
      signerUserAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
      authorityDelegationStatus: userDelegate.authorityDelegationStatusPDA,
      delegatePublicKey: userDelegate.userAuthorityDelegateKeypair.publicKey,
      delegateBump: userDelegate.userAuthorityDelegateBump,
      authorityPublicKey: userDelegate.userKeypair.publicKey,
      payer: provider.wallet.publicKey,
    });

    await provider.sendAndConfirm(removeUserAuthorityDelegateTx, [
      userDelegate.userKeypair,
    ]);

    // Confirm account deallocated after removal
    await pollAccountBalance({
      provider: provider,
      targetAccount: userDelegate.userAuthorityDelegatePDA,
      targetBalance: 0,
      maxRetries: 100,
    });
    await expect(
      provider.sendAndConfirm(
        updateUser({
          program,
          metadata: randomCID(),
          userStorageAccount: userDelegate.userAccountPDA,
          userAuthorityPublicKey:
            userDelegate.userAuthorityDelegateKeypair.publicKey,
          userAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
          authorityDelegationStatusAccount:
            userDelegate.authorityDelegationStatusPDA,
        }),
        [userDelegate.userAuthorityDelegateKeypair]
      )
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Program log: AnchorError occurred. Error Code: AccountDiscriminatorNotFound. Error Number: 3001. Error Message: No 8 byte discriminator was found on the account.`
      );
  });

  it("Revoking authority delegation status", async function () {
    const userDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair,
      program,
      provider,
    });

    const acctState = await program.account.userAuthorityDelegate.fetch(
      userDelegate.userAuthorityDelegatePDA
    );
    const userStgPdaFromChain = acctState.userStorageAccount;
    const delegateAuthorityFromChain = acctState.delegateAuthority;
    expect(userStgPdaFromChain.toString(), "user stg pda").to.equal(
      userDelegate.userAccountPDA.toString()
    );
    expect(
      userDelegate.userAuthorityDelegateKeypair.publicKey.toString(),
      "del auth pda"
    ).to.equal(delegateAuthorityFromChain.toString());
    const updatedCID = randomCID();
    const updateUserTx = updateUser({
      program,
      metadata: updatedCID,
      userStorageAccount: userDelegate.userAccountPDA,
      userAuthorityPublicKey:
        userDelegate.userAuthorityDelegateKeypair.publicKey,
      userAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
      authorityDelegationStatusAccount:
        userDelegate.authorityDelegationStatusPDA,
    });
    await provider.sendAndConfirm(updateUserTx, [
      userDelegate.userAuthorityDelegateKeypair,
    ]);

    // revoke authority delegation
    const revokeAuthorityDelegationTx = revokeAuthorityDelegation({
      program,
      authorityDelegationBump: userDelegate.authorityDelegationStatusBump,
      userAuthorityDelegatePublicKey:
        userDelegate.userAuthorityDelegateKeypair.publicKey,
      authorityDelegationStatusPDA: userDelegate.authorityDelegationStatusPDA,
      payer: provider.wallet.publicKey,
    });

    await provider.sendAndConfirm(revokeAuthorityDelegationTx, [
      userDelegate.userAuthorityDelegateKeypair,
    ]);

    // Confirm revoked delegation cannot update user
    await expect(
      provider.sendAndConfirm(
        updateUser({
          program,
          metadata: randomCID(),
          userStorageAccount: userDelegate.userAccountPDA,
          userAuthorityPublicKey:
            userDelegate.userAuthorityDelegateKeypair.publicKey,
          userAuthorityDelegate: userDelegate.userAuthorityDelegatePDA,
          authorityDelegationStatusAccount:
            userDelegate.authorityDelegationStatusPDA,
        }),
        [userDelegate.userAuthorityDelegateKeypair]
      )
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Program log: AnchorError occurred. Error Code: RevokedAuthority. Error Number: 6001. Error Message: This authority's delegation status is revoked..`
      );
  });

  it("delegate adds/removes another delegate", async function () {
    const firstUserDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair,
      program,
      provider,
    });

    const secondUserDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair,
      program,
      provider,
    });

    const userAuthorityDelegateSeeds = [
      firstUserDelegate.userAccountPDA.toBytes().slice(0, 32),
      secondUserDelegate.userAuthorityDelegateKeypair.publicKey
        .toBytes()
        .slice(0, 32),
    ];
    const res = await PublicKey.findProgramAddress(
      userAuthorityDelegateSeeds,
      program.programId
    );
    const currentUserAuthorityDelegatePDA = res[0];
    const currentUserAuthorityDelegateBump = res[1];

    const addUserAuthorityDelegateTx = addUserAuthorityDelegate({
      program,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      baseAuthorityAccount: firstUserDelegate.baseAuthorityAccount,
      userId: firstUserDelegate.userId,
      userBumpSeed: firstUserDelegate.userBumpSeed,
      user: firstUserDelegate.userAccountPDA,
      currentUserAuthorityDelegate: currentUserAuthorityDelegatePDA,
      signerUserAuthorityDelegate: firstUserDelegate.userAuthorityDelegatePDA,
      authorityDelegationStatus: firstUserDelegate.authorityDelegationStatusPDA,
      delegatePublicKey:
        secondUserDelegate.userAuthorityDelegateKeypair.publicKey,
      authorityPublicKey:
        firstUserDelegate.userAuthorityDelegateKeypair.publicKey,
      payer: provider.wallet.publicKey,
    });

    await provider.sendAndConfirm(addUserAuthorityDelegateTx, [
      firstUserDelegate.userAuthorityDelegateKeypair,
    ]);

    const removeUserAuthorityDelegateTx = removeUserAuthorityDelegate({
      program,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      baseAuthorityAccount: firstUserDelegate.baseAuthorityAccount,
      userId: firstUserDelegate.userId,
      userBumpSeed: firstUserDelegate.userBumpSeed,
      user: firstUserDelegate.userAccountPDA,
      currentUserAuthorityDelegate: currentUserAuthorityDelegatePDA,
      signerUserAuthorityDelegate: firstUserDelegate.userAuthorityDelegatePDA,
      authorityDelegationStatus: firstUserDelegate.authorityDelegationStatusPDA,
      delegatePublicKey:
        secondUserDelegate.userAuthorityDelegateKeypair.publicKey, // seed for userAuthorityDelegatePda
      delegateBump: currentUserAuthorityDelegateBump,
      authorityPublicKey:
        firstUserDelegate.userAuthorityDelegateKeypair.publicKey,
      payer: provider.wallet.publicKey,
    });
    await provider.sendAndConfirm(removeUserAuthorityDelegateTx, [
      firstUserDelegate.userAuthorityDelegateKeypair,
    ]);
  });

  it("creating initialized user should fail", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
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
      userStorageAccount: newUserAcctPDA,
      adminStorageKeypair,
      adminKeypair,
      ...getURSMParams(),
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
        userId,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStorageAccount: newUserAcctPDA,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Allocate: account Address { address: ${newUserAcctPDA.toString()}, base: None } already in use`
      );
  });

  it("creating user with incorrect bump seed / pda should fail", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const { baseAuthorityAccount, bumpSeed } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // New sol key that will be used to permission user updates
    const newUserKeypair = anchor.web3.Keypair.generate();

    // Generate signed SECP instruction
    // Message as the incoming public key
    const message = newUserKeypair.publicKey.toBytes();

    const { userId: incorrectUserId } = initTestConstants();

    const { derivedAddress: incorrectPDA } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      incorrectUserId
    );

    await expect(
      testCreateUser({
        provider,
        program,
        message,
        ethAccount,
        baseAuthorityAccount,
        userId,
        bumpSeed,
        metadata,
        newUserKeypair,
        userStorageAccount: incorrectPDA,
        adminStoragePublicKey: adminStorageKeypair.publicKey,
        ...getURSMParams(),
      })
    )
      .to.eventually.be.rejected.and.property("logs")
      .to.include(
        `Program ${program.programId.toString()} failed: Cross-program invocation with unauthorized signer or writable account`
      );
  });

  it("Verify user", async function () {
    const { ethAccount, metadata, userId } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
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
      userId,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStorageAccount: newUserAcctPDA,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      ...getURSMParams(),
    });
    const tx = updateIsVerified({
      program,
      adminPublicKey: adminStorageKeypair.publicKey,
      userStorageAccount: newUserAcctPDA,
      verifierPublicKey: verifierKeypair.publicKey,
      baseAuthorityAccount,
      userId,
      bumpSeed,
    });
    const txSignature = await provider.sendAndConfirm(tx, [verifierKeypair]);

    await confirmLogInTransaction(provider, txSignature, "success");
  });

  it("creating + deleting a track", async function () {
    const { ethAccount, userId, metadata } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
      userId,
      bumpSeed,
      metadata,
      newUserKeypair,
      userStorageAccount: newUserAcctPDA,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      ...getURSMParams(),
    });

    const trackMetadata = randomCID();
    const trackID = randomId();

    await testCreateTrack({
      provider,
      program,
      id: trackID,
      baseAuthorityAccount,
      userId,
      adminStorageAccount: adminStorageKeypair.publicKey,
      bumpSeed,
      trackMetadata,
      userAuthorityKeypair: newUserKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
    });

    await testDeleteTrack({
      program,
      provider,
      id: trackID,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityDelegateAccountPDA: SystemProgram.programId,
      authorityDelegationStatusAccountPDA: SystemProgram.programId,
      userAuthorityKeypair: newUserKeypair,
      baseAuthorityAccount,
      userId,
      bumpSeed,
      adminStorageAccount: adminStorageKeypair.publicKey,
    });
  });

  it("delegate creates a track (manage entity) + all validation errors", async function () {
    // create user and delegate
    const { ethAccount, userId, metadata } = initTestConstants();
    const {
      baseAuthorityAccount,
      bumpSeed: userBumpSeed,
      derivedAddress: userAccountPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
      userId,
      bumpSeed: userBumpSeed,
      metadata,
      newUserKeypair,
      userStorageAccount: userAccountPDA,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      ...getURSMParams(),
    });

    // New sol key that will be used as user authority delegate
    const userAuthorityDelegateKeypair = anchor.web3.Keypair.generate();

    // AuthorityDelegationStatus PDA
    const authorityDelegationStatusSeeds = [
      Buffer.from("authority-delegation-status", "utf8"),
      userAuthorityDelegateKeypair.publicKey.toBytes().slice(0, 32),
    ];
    const authorityDelegationStatusRes = await PublicKey.findProgramAddress(
      authorityDelegationStatusSeeds,
      program.programId
    );
    const authorityDelegationStatusPDA = authorityDelegationStatusRes[0];

    // UserAuthorityDelegate PDA
    const userAuthorityDelegateSeeds = [
      userAccountPDA.toBytes().slice(0, 32),
      userAuthorityDelegateKeypair.publicKey.toBytes().slice(0, 32),
    ];
    const res = await PublicKey.findProgramAddress(
      userAuthorityDelegateSeeds,
      program.programId
    );
    const userAuthorityDelegatePDA = res[0];

    const trackMetadata = randomCID();
    const trackID = randomId();

    // Attempt create track before init UserAuthorityDelegate
    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // Attempt create track before init AuthorityDelegationStatus
    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // Init AuthorityDelegationStatus for a new authority
    const initAuthorityDelegationStatusTx = initAuthorityDelegationStatus({
      program,
      authorityName: "authority_name",
      userAuthorityDelegatePublicKey: userAuthorityDelegateKeypair.publicKey,
      authorityDelegationStatusPDA,
      payer: provider.wallet.publicKey,
    });
    await provider.sendAndConfirm(initAuthorityDelegationStatusTx, [
      userAuthorityDelegateKeypair,
    ]);

    // Add a user delegate relationship
    const addUserAuthorityDelegateTx = addUserAuthorityDelegate({
      program,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      baseAuthorityAccount: baseAuthorityAccount,
      userId: userId,
      userBumpSeed: userBumpSeed,
      user: userAccountPDA,
      currentUserAuthorityDelegate: userAuthorityDelegatePDA,
      signerUserAuthorityDelegate: SystemProgram.programId,
      authorityDelegationStatus: SystemProgram.programId,
      delegatePublicKey: userAuthorityDelegateKeypair.publicKey,
      authorityPublicKey: newUserKeypair.publicKey,
      payer: provider.wallet.publicKey,
    });
    await provider.sendAndConfirm(addUserAuthorityDelegateTx, [newUserKeypair]);

    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: SystemProgram.programId, // missing PDA
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program,
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: SystemProgram.programId, // missing PDA
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // use different user authority delegate PDA
    const badUserDelegate = await testCreateUserDelegate({
      adminKeypair,
      adminStorageKeypair: adminStorageKeypair,
      program,
      provider,
    });

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA:
          badUserDelegate.userAuthorityDelegatePDA, // mismatched PDA
        authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    // use different authority delegation status PDA

    await expect(
      testCreateTrack({
        provider,
        program: anchor.web3.Keypair.generate().publicKey, // wrong program
        id: trackID,
        baseAuthorityAccount: baseAuthorityAccount,
        userId: userId,
        adminStorageAccount: adminStorageKeypair.publicKey,
        bumpSeed: userBumpSeed,
        trackMetadata,
        userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
        trackOwnerPDA: userAccountPDA,
        userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
        authorityDelegationStatusAccountPDA:
          badUserDelegate.authorityDelegationStatusPDA,
      })
    ).to.be.rejectedWith(Error);

    await testCreateTrack({
      provider,
      program,
      id: trackID,
      baseAuthorityAccount: baseAuthorityAccount,
      userId: userId,
      adminStorageAccount: adminStorageKeypair.publicKey,
      bumpSeed: userBumpSeed,
      trackMetadata,
      userAuthorityKeypair: userAuthorityDelegateKeypair, // substitute delegate
      trackOwnerPDA: userAccountPDA,
      userAuthorityDelegateAccountPDA: userAuthorityDelegatePDA,
      authorityDelegationStatusAccountPDA: authorityDelegationStatusPDA,
    });
  });

  it("create multiple tracks in parallel", async function () {
    const { ethAccount, metadata, userId } = initTestConstants();

    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: newUserAcctPDA,
    } = await findDerivedPair(
      program.programId,
      adminStorageKeypair.publicKey,
      convertBNToUserIdSeed(userId)
    );

    // Disable admin writes
    await updateAdmin({
      program,
      isWriteEnabled: false,
      adminStorageAccount: adminStorageKeypair.publicKey,
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
      bumpSeed,
      metadata,
      newUserKeypair,
      userId,
      userStorageAccount: newUserAcctPDA,
      adminStoragePublicKey: adminStorageKeypair.publicKey,
      ...getURSMParams(),
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
        userId,
        bumpSeed,
        adminStorageAccount: adminStorageKeypair.publicKey,
        id: randomId(),
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
        userId,
        bumpSeed,
        adminStorageAccount: adminStorageKeypair.publicKey,
        id: randomId(),
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
        userId,
        bumpSeed,
        adminStorageAccount: adminStorageKeypair.publicKey,
        id: randomId(),
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
