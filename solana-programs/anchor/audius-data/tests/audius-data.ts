import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AudiusData } from '../target/types/audius_data';
import * as secp256k1 from 'secp256k1';
import ethWeb3 from 'web3';
import { randomBytes } from 'crypto';
import { ethAddressToArray, getRandomPrivateKey, signBytes, randomCID, findDerivedPair } from './utils';

const { SystemProgram, PublicKey, Transaction, Secp256k1Program } = anchor.web3;

describe('audius-data', () => {
  const provider = anchor.Provider.local(
    "http://localhost:8899",
    {
      preflightCommitment: "confirmed",
      commitment: "confirmed"
    }
  )

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;
  const SystemSysVarProgramKey = new PublicKey("Sysvar1nstructions1111111111111111111111111")
  const EthWeb3 = new ethWeb3()
  const DefaultPubkey = new PublicKey("11111111111111111111111111111111")

  let adminKeypair = anchor.web3.Keypair.generate()
  let adminStgKeypair = anchor.web3.Keypair.generate()

  const getTransaction = async (tx: string) => {
    let info = await provider.connection.getTransaction(tx)
    while (info == null) {
      info = await provider.connection.getTransaction(tx)
    }
    return info
  }

  const confirmLogInTransaction = async (tx: string, log: string) => {
    let info = await getTransaction(tx)
    let logs = info.meta.logMessages
    let stringFound = false
    logs.forEach((v) => {
      if (v.indexOf(log) > 0) {
        stringFound = true
      }
    })
    if (!stringFound) {
      console.log(logs)
      throw new Error(`Failed to find ${log} in tx=${tx}`)
    }
  }

  const testInitUser = async (
    baseAuthorityAccount: anchor.web3.PublicKey,
    testEthAddr: string,
    testEthAddrBytes: Uint8Array,
    handleBytesArray: number[],
    bumpSeed: number,
    metadata: string,
    userStgAccount: anchor.web3.PublicKey
  ) => {
    let tx = await program.rpc.initUser(
      baseAuthorityAccount,
      Array.from(testEthAddrBytes),
      handleBytesArray,
      bumpSeed,
      metadata,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          user: userStgAccount,
          authority: adminKeypair.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminKeypair]
      }
    )

    const userDataFromChain = await program.account.user.fetch(userStgAccount)
    const returnedHex = EthWeb3.utils.bytesToHex(userDataFromChain.ethAddress)
    const returnedSolFromChain = userDataFromChain.authority

    if (testEthAddr.toLowerCase() != returnedHex) {
      throw new Error(`Invalid eth address - expected ${testEthAddr.toLowerCase()}, found ${returnedHex}`)
    }

    if (!DefaultPubkey.equals(returnedSolFromChain)) {
      throw new Error(`Unexpected public key found`)
    }

    await confirmLogInTransaction(tx, metadata)
  }

  const testInitUserSolPubkey = async ({
    message,
    pkString,
    privKey,
    newUserKey,
    newUserAcctPDA
  }) => {
    const signedBytes = signBytes(Buffer.from(message), pkString)
    const { signature, recoveryId } = signedBytes

    // Get the public key in a compressed format
    const ethPubkey = secp256k1.publicKeyCreate(privKey, false).slice(1)
    const secpTransactionInstruction = Secp256k1Program.createInstructionWithPublicKey({
      publicKey: Buffer.from(ethPubkey),
      message: Buffer.from(message),
      signature,
      recoveryId
    })

    await provider.send(
      (() => {
        const tx = new Transaction();
        tx.add(secpTransactionInstruction),
        tx.add(
          program.instruction.initUserSol(
            newUserKey.publicKey,
            {
              accounts:
              {
                user: newUserAcctPDA,
                sysvarProgram: SystemSysVarProgramKey
              }
            }
          )
        )
        return tx;
      })(),
      [
        // Signers
      ]
    );
    let userDataFromChain = await program.account.user.fetch(newUserAcctPDA)
    if (!newUserKey.publicKey.equals(userDataFromChain.authority)) {
      throw new Error('Unexpected public key found')
    }
  }

  const testCreateTrack = async ({
    trackMetadata,
    newTrackKeypair,
    userAuthorityKey,
    trackOwnerPDA
  }) => {
    let tx = await program.rpc.createTrack(
      trackMetadata,
      {
        accounts: {
          track: newTrackKeypair.publicKey,
          user: trackOwnerPDA,
          authority: userAuthorityKey.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [userAuthorityKey, newTrackKeypair]
      }
    )

    await confirmLogInTransaction(tx, trackMetadata)
  }

  const testDeleteTrack = async ({
    trackKeypair,
    trackOwnerPDA,
    userAuthorityKey
  }) => {

    const initialTrackAcctBalance = await provider.connection.getBalance(trackKeypair.publicKey)
    const initialPayerBalance = await provider.connection.getBalance(provider.wallet.publicKey)

    await program.rpc.deleteTrack({
      accounts: {
        track: trackKeypair.publicKey,
        user: trackOwnerPDA,
        authority: userAuthorityKey.publicKey,
        payer: provider.wallet.publicKey,
      },
      signers: [userAuthorityKey]
    })

    // Confirm that the account is zero'd out
    // Note that there appears to be a delay in the propagation, hence the retries
    let trackAcctBalance = initialTrackAcctBalance
    let payerBalance = initialPayerBalance
    let retries = 20
    while (trackAcctBalance > 0 || retries > 0) {
      trackAcctBalance = await provider.connection.getBalance(trackKeypair.publicKey)
      payerBalance = await provider.connection.getBalance(provider.wallet.publicKey)
      retries--
    }

    if (trackAcctBalance > 0) {
      throw new Error('Failed to deallocate track')
    }

    console.log(`Track acct lamports ${initialTrackAcctBalance} -> ${trackAcctBalance}`)
    console.log(`Payer acct lamports ${initialPayerBalance} -> ${payerBalance}`)
  }

  const initTestConstants = () => {
    const privKey = getRandomPrivateKey()
    const pkString = Buffer.from(privKey).toString('hex')
    const pubKey = EthWeb3.eth.accounts.privateKeyToAccount(pkString)
    const testEthAddr = pubKey.address
    const testEthAddrBytes = ethAddressToArray(testEthAddr)
    const handle = randomBytes(20).toString('hex');
    const handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle))
    const handleBytesArray = Array.from({...handleBytes, length: 16})
    const metadata = randomCID()
    const values = {
      privKey,
      pkString,
      pubKey,
      testEthAddr,
      testEthAddrBytes,
      handle,
      handleBytes,
      handleBytesArray,
      metadata
    }
    return values
  }

  it('Initializing admin account!', async () => {
    // Add your test here.
    const tx = await program.rpc.initAdmin(
      adminKeypair.publicKey,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminStgKeypair]
      }
    )

    let adminAccount = await program.account.audiusAdmin.fetch(adminStgKeypair.publicKey)
    if (!adminAccount.authority.equals(adminKeypair.publicKey)) {
      console.log("Your transaction signature", tx);
      console.log("On chain retrieved admin info: ", adminAccount.authority.toString());
      console.log("Provided admin info: ", adminKeypair.publicKey.toString());
      throw new Error("Invalid returned values")
    }
  });

  it('Initializing user!', async () => {
    let {
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let  { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

    await testInitUser(
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserAcctPDA
    )
  });

  it('Initializing + claiming user!', async () => {
    let {
      privKey,
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

    await testInitUser(
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserAcctPDA
    )

    // New sol key that will be used to permission user updates
    let newUserKey = anchor.web3.Keypair.generate()

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKey.publicKey.toString()

    await testInitUserSolPubkey({
      message,
      pkString,
      privKey,
      newUserKey,
      newUserAcctPDA
    })
  });

  it('Initializing + claiming + updating user!', async () => {
    let {
      privKey,
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

    await testInitUser(
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserAcctPDA
    )

    // New sol key that will be used to permission user updates
    let newUserKey = anchor.web3.Keypair.generate()

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKey.publicKey.toString()

    await testInitUserSolPubkey({
      message,
      pkString,
      privKey,
      newUserKey,
      newUserAcctPDA
    })

    let updatedCID = randomCID()
    let tx = await program.rpc.updateUser(
      updatedCID,
      {
        accounts: {
          user: newUserAcctPDA,
          userAuthority: newUserKey.publicKey
        },
        signers: [newUserKey]
      }
    )
    await confirmLogInTransaction(tx, updatedCID)
  });

  it('Initializing + claiming user, creating + updating track', async () => {
    let {
      privKey,
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

    await testInitUser(
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserAcctPDA
    )

    // New sol key that will be used to permission user updates
    let newUserKey = anchor.web3.Keypair.generate()

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKey.publicKey.toString()

    await testInitUserSolPubkey({
      message,
      pkString,
      privKey,
      newUserKey,
      newUserAcctPDA
    })

    // TODO: Abstract track creation function
    let newTrackKeypair = anchor.web3.Keypair.generate()
    let trackMetadata = randomCID()

    await testCreateTrack({
      trackMetadata,
      newTrackKeypair,
      userAuthorityKey: newUserKey,
      trackOwnerPDA: newUserAcctPDA
    })

    // Expected signature validation failure
    let newTrackKeypair2 = anchor.web3.Keypair.generate()
    let wrongUserKey = anchor.web3.Keypair.generate()
    console.log(`Expecting error with public key ${wrongUserKey.publicKey}`)
    try {
      await testCreateTrack({
        trackMetadata,
        newTrackKeypair : newTrackKeypair2,
        userAuthorityKey: wrongUserKey,
        trackOwnerPDA: newUserAcctPDA
      })
    } catch(e) {
      console.log(`ERROR FOUND AS EXPECTED ${e}`)
    }

    let updatedTrackMetadata = randomCID()
    console.log(`Updating track`)
    let tx3 = await program.rpc.updateTrack(
      updatedTrackMetadata,
      {
        accounts: {
          track: newTrackKeypair.publicKey,
          user: newUserAcctPDA,
          authority: newUserKey.publicKey,
          payer: provider.wallet.publicKey
        },
        signers: [newUserKey]
      }
    )
    await confirmLogInTransaction(tx3, updatedTrackMetadata)
  })

  it('creating + deleting a track', async () => {
    let {
      privKey,
      pkString,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

    await testInitUser(
      baseAuthorityAccount,
      testEthAddr,
      testEthAddrBytes,
      handleBytesArray,
      bumpSeed,
      metadata,
      newUserAcctPDA
    )

    // New sol key that will be used to permission user updates
    let newUserKey = anchor.web3.Keypair.generate()

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKey.publicKey.toString()

    await testInitUserSolPubkey({
      message,
      pkString,
      privKey,
      newUserKey,
      newUserAcctPDA
    })

    let newTrackKeypair = anchor.web3.Keypair.generate()

    let trackMetadata = randomCID()
    await testCreateTrack({
      trackMetadata,
      newTrackKeypair,
      userAuthorityKey: newUserKey,
      trackOwnerPDA: newUserAcctPDA
    })

    await testDeleteTrack({
      trackKeypair: newTrackKeypair,
      trackOwnerPDA: newUserAcctPDA,
      userAuthorityKey: newUserKey
    })

  })
});
