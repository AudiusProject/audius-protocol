import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { AudiusData } from '../target/types/audius_data';
import BN from 'bn.js';
import * as secp256k1 from 'secp256k1';
import ethWeb3 from 'web3';
const { randomBytes } = require('crypto')

// import * as keccak256 from "keccak256";

import keccak256 from 'keccak256';
const { SystemProgram, PublicKey, Transaction, Secp256k1Program } = anchor.web3;

describe('audius-data', () => {
  const provider = anchor.Provider.local()

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.AudiusData as Program<AudiusData>;

  const SystemSysVarProgramKey = new PublicKey("Sysvar1nstructions1111111111111111111111111")
  const ethWeb3Utils = new ethWeb3()

  let adminKeypair = anchor.web3.Keypair.generate()
  let adminStgKeypair = anchor.web3.Keypair.generate()
  let userKeypair = anchor.web3.Keypair.generate()

  console.log(`adminKeypair = ${adminKeypair.publicKey.toString()}`)
  console.log(`adminStgKeypair ${adminStgKeypair.publicKey.toString()}`)
  console.log(`userKeypair ${userKeypair.publicKey.toString()}`)

  let getRandomPrivateKey = () => {
    const msg = randomBytes(32)
    let privKey: Uint8Array
    do {
      privKey = randomBytes(32)
    } while (!secp256k1.privateKeyVerify(privKey))
    return privKey
  }

  const findProgramAddress = (programId, pubkey) => {
    return PublicKey.findProgramAddress(
      [pubkey.toBytes().slice(0, 32)],
      programId
    )
  }

  // Finds a 'derived' address by finding a programAddress with
  // seeds array  as first 32 bytes of base + seeds
  const findDerivedAddress = async (programId: anchor.web3.PublicKey, base: anchor.web3.PublicKey, seed: any) => {
    let finalSeed = [base.toBytes().slice(0, 32), seed]
    let result = await PublicKey.findProgramAddress(
      finalSeed,
      programId
    )
    return {
      seed: finalSeed,
      result
    }
  }

  const findDerivedPair = async (programId, adminAccount, seed) => {
    // Finds the rewardManagerAuthority account by generating
    // a PDA with the rewardsMnager as a seed
    const [baseAuthorityAccount] = await findProgramAddress(
      programId,
      adminAccount
    )
    const derivedAddresInfo = await findDerivedAddress(
      programId,
      baseAuthorityAccount,
      seed
    )

    const derivedAddress = derivedAddresInfo.result[0]
    const bumpSeed = derivedAddresInfo.result[1]

    return  {baseAuthorityAccount, derivedAddress, bumpSeed }
  }

  const initTestConstants = () => {
    let privKey = getRandomPrivateKey()
    let pkString = Buffer.from(privKey).toString('hex')
    let pubKey = ethWeb3Utils.eth.accounts.privateKeyToAccount(pkString)
    let testEthAddr = pubKey.address
    let testEthAddrBytes = ethAddressToArray(testEthAddr)
    let handle = randomBytes(20).toString('hex');
    let handleBytes = Buffer.from(anchor.utils.bytes.utf8.encode(handle))
    let handleBytesArray = Array.from({...handleBytes, length: 16})
    let metadata = "QmTXWUkHWBUJ878gi2B25q6N4BWnjojLbSExyaqJxSDPrH"
    let values = {
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
    console.log(`Test info - ${JSON.stringify(values)}`)
    return values
  }

  it('Initializing admin account!', async () => {
    // Add your test here.
    const tx = await program.rpc.initializeAdmin(
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

    console.log("Your transaction signature", tx);
    let adminAccount = await program.account.audiusAdmin.fetch(adminStgKeypair.publicKey)
    console.log("On chain retrieved admin info: ", adminAccount.authority.toString());
    console.log("Provided admin info: ", adminKeypair.publicKey.toString());
  });

  it('Initializing user!', async () => {
    let {
      privKey,
      pkString,
      pubKey,
      testEthAddr,
      testEthAddrBytes,
      handle,
      handleBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let  { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

     await program.rpc.initUser(
      baseAuthorityAccount,
      Array.from(testEthAddrBytes),
      handleBytesArray,
      bumpSeed,
      metadata,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          user: newUserAcctPDA,
          authority: adminKeypair.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminKeypair]
      }
    )

    let userDataFromChain = await program.account.user.fetch(newUserAcctPDA)
    let returnedHex = ethWeb3Utils.utils.bytesToHex(userDataFromChain.ethAddress)
    console.log(`Eth address from chain ${returnedHex} | Original eth ${testEthAddr}`)

    let returnedSolFromChain = userDataFromChain.solanaPubKey
    console.log(`returnedSolFromChain  = ${returnedSolFromChain}`)

    if (testEthAddr.toLowerCase() == returnedHex) {
      console.log(`Retrieved address!`)
    }
  });

  it('Initializing + claiming user!', async () => {
    let {
      privKey,
      pkString,
      pubKey,
      testEthAddr,
      testEthAddrBytes,
      handle,
      handleBytes,
      handleBytesArray,
      metadata
    }  = initTestConstants()

    let { baseAuthorityAccount, bumpSeed, derivedAddress }  = await findDerivedPair(
      program.programId,
      adminStgKeypair.publicKey,
      Buffer.from(handleBytesArray)
    )
    let newUserAcctPDA = derivedAddress

     await program.rpc.initUser(
      baseAuthorityAccount,
      Array.from(testEthAddrBytes),
      handleBytesArray,
      bumpSeed,
      metadata,
      {
        accounts: {
          admin: adminStgKeypair.publicKey,
          payer: provider.wallet.publicKey,
          user: newUserAcctPDA,
          authority: adminKeypair.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [adminKeypair]
      }
    )

    let userDataFromChain = await program.account.user.fetch(newUserAcctPDA)
    let returnedHex = ethWeb3Utils.utils.bytesToHex(userDataFromChain.ethAddress)
    console.log(`Eth address from chain ${returnedHex} | Original eth ${testEthAddr}`)

    let returnedSolFromChain = userDataFromChain.solanaPubKey
    console.log(`returnedSolFromChain  = ${returnedSolFromChain}`)

    if (testEthAddr.toLowerCase() == returnedHex) {
      console.log(`Retrieved address!`)
    }

    // New sol key that will be used to permission user updates
    let newUserKey = anchor.web3.Keypair.generate()
    console.log(`newUserKey = ${newUserKey.publicKey}`)
    console.log(`ethAddressBytes = ${testEthAddrBytes}`)

    // Generate signed SECP instruction
    // Message as the incoming public key
    let message = newUserKey.publicKey.toString()

    let signedBytes = signBytes(Buffer.from(message), pkString)
    const { signature, recoveryId } = signedBytes

    // Get the public key in a compressed format
    const ethPubkey = secp256k1.publicKeyCreate(privKey, false).slice(1)
    const secpTransactionInstruction = Secp256k1Program.createInstructionWithPublicKey({
      publicKey: Buffer.from(ethPubkey),
      message: Buffer.from(message),
      signature,
      recoveryId
    })

    let tx = await provider.send(
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
                payer: provider.wallet.publicKey,
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
    userDataFromChain = await program.account.user.fetch(newUserAcctPDA)
    returnedHex = ethWeb3Utils.utils.bytesToHex(userDataFromChain.ethAddress)
    console.log(`Eth address from chain ${returnedHex} | Sol address from chain ${userDataFromChain.solanaPubKey}`)
  });
});

let signBytes = (bytes: any, ethPrivateKey: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: "string"): string; }) => {
  const ethPrivateKeyArr = Buffer.from(ethPrivateKey, 'hex')
  const msgHash = keccak256(bytes)
  const signatureObj = secp256k1.ecdsaSign(
    Uint8Array.from(msgHash),
    ethPrivateKeyArr
  )
  const signature = Buffer.from(signatureObj.signature)
  return {
    signature,
    recoveryId: signatureObj.recid
  }
}

function ethAddressToArray(ethAddress: any) {
  const strippedEthAddress = ethAddress.replace('0x', '')
  return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be'))
}