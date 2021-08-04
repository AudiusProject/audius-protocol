import { Connection, Keypair, PublicKey, Secp256k1Program, sendAndConfirmTransaction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js"
import {ecdsaSign} from 'secp256k1'
import {keccak_256} from 'js-sha3'
const borsh = require('borsh')

const BN = require('bn.js')

/// Sender program account seed
const SENDER_SEED_PREFIX = "S_"
const VERIFY_TRANSFER_SEED_PREFIX = "V_"

// 1 + 32 + 1 + (168 * 5)
const VERIFIED_MESSAGES_LEN = 874

// 3qvNmjbxmF9CDHzAEBvLSePRiMWtVcXPaRPiPtmrT29xkj
// @ts-ignore
window.bn = BN

class VerifyTransferSignatureInstructionData {
  id: string
  constructor ({
    transferId
  }: {transferId: string}) {
    this.id = transferId
  }
}

const verifyTransferSignatureInstructionSchema = new Map([
  [
    VerifyTransferSignatureInstructionData,
    {
      kind: 'struct',
      fields: [
        ['id', 'string']
      ]
    }
  ]
])

// TODO: this should work with *multiple* votes
export async function verifyTransferSignature({
  rewardManagerProgramId,
  rewardManagerAccount,
  ethAddress,
  challengeId,
  specifier,
  feePayer,
  feePayerSecret, // Remove this :)
  attestationSignature,
  recoveryId,
  recipientEthAddress,
  tokenAmount,
  oracleAddress,
  isBot = false
}: {
  rewardManagerProgramId: PublicKey,
  rewardManagerAccount: PublicKey,
  ethAddress: string,
  challengeId: string,
  specifier: string,
  feePayer: PublicKey,
  feePayerSecret: Uint8Array,
  attestationSignature: string,
  recoveryId: number,
  recipientEthAddress: string,
  tokenAmount: number, // TODO: this should be a BN I think?
  oracleAddress: string,
  isBot?: boolean
}) {
  const connection = new Connection('https://api.devnet.solana.com')
  const encoder = new TextEncoder()
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  // TOOD: this *might* have to be hashed?
  const strippedEthAddress = ethAddress.replace('0x', '')
  const ethAddressArr = Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )

  const [, derivedSender, ] = await findDerivedPair(
    rewardManagerProgramId,
    rewardManagerAccount,
    new Uint8Array([...encodedPrefix, ...ethAddressArr])
  )
  console.log("DP1 Derived:")
  console.log({derived: derivedSender.toString()})

  const transferId = `${challengeId}:${specifier}`
  const [rewardManagerAuthority, derivedMessageAccount,] = await deriveMessageAccount(transferId, rewardManagerProgramId, rewardManagerAccount)

  // TODO: create the instruction

    ///   Verify transfer signature
    ///
    ///   0. `[writable]` New or existing account storing verified messages
    ///   1. `[]` Reward manager
    ///   1. `[]` Reward manager authority (NEW)
    ///   1. `[]` fee payer (NEW)
    ///   2. `[]` Sender
    ///   2. `[]` sysvar rent (new)
    ///   3. `[]` Sysvar instruction id (NEW)
  const verifyInstructionAccounts = [
    {
      pubkey: derivedMessageAccount,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: rewardManagerAccount,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: rewardManagerAuthority,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: feePayer,
      isSigner: true,
      isWritable: true
    },
    {
      pubkey: derivedSender,
      isSigner: false, // IDK?
      isWritable: false
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }
  ]

  const instructionData = new VerifyTransferSignatureInstructionData({ transferId })
  const serializedInstructionData = borsh.serialize(
    verifyTransferSignatureInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(Uint8Array.of(
    4,
    ...serializedInstructionData
  ))

  const verifyTransferSignatureInstruction = new TransactionInstruction({
    keys: verifyInstructionAccounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })


  let senderMessage = (isBot ? [
    recipientEthAddress,
    tokenAmount,
    transferId,
  ]: [
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAddress
  ]).join("_")

  const messageHash = Buffer.from(keccak_256.update(senderMessage).digest())
  const pkey = Uint8Array.from(new BN('864ca29f6d40bb740cdd94f07443c483ade0b43db351c263b980c513b98ca4e6', 'hex').toArray('be'))
  const {signature, recid} = ecdsaSign(messageHash, pkey)

  console.log({senderMessage})
  console.log({signature, recid})

  const encodedSenderMessage = encoder.encode(senderMessage)
  // Perform signature manipulations:
  // - remove the 0x prefix, and then lose the final byte
  // ('1b', which is the recovery ID, and not desired by the `createInsturctionWithEthAddress` method)
  let strippedSignature = attestationSignature.replace('0x', '')
  strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2)
  console.log({strippedSignature})
  const encodedSignature = Uint8Array.of(
    ...new BN(strippedSignature, 'hex').toArray('be') // 0 pad to add length, but this seems wrong. Idk
  )
  console.log({encodedSignature})
  console.log("len: " + encodedSignature.length)

  const secpInstruction = Secp256k1Program.createInstructionWithEthAddress({
    ethAddress,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
  })

  console.log({secpInstruction})

  const instructions = [
    secpInstruction,
    verifyTransferSignatureInstruction
  ]

  const {blockhash: recentBlockhash} = await connection.getRecentBlockhash()
  const transaction = new Transaction({
    feePayer,
    recentBlockhash,
  })
  transaction.add(...instructions)
  console.log({feePayer, feePayerSecret})
  // Sign with the fee payer
  transaction.sign({
    publicKey: feePayer,
    secretKey: feePayerSecret
  })
  const isVerified = transaction.verifySignatures()
  console.log({isVerified})
  console.log({sigs: transaction.signatures})

  try {
    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [
        {
          publicKey: feePayer,
          secretKey: feePayerSecret
        },
      ],
      {
        skipPreflight: false,
        commitment: 'processed',
        preflightCommitment: 'processed'
      }
    )
    return transactionSignature
  } catch (e) {
    console.error("SENT BUT ERROR")
    console.error(e.message)
    console.log({e})
  }

}

// Derives the account for messages to live in
const deriveMessageAccount = async (transferId: string, rewardsProgramId: PublicKey, rewardManager: PublicKey) => {
  const encoder = new TextEncoder()
  const encodedPrefix = encoder.encode(VERIFY_TRANSFER_SEED_PREFIX)
  const encodedTransferId = encoder.encode(transferId)
  const seeds = Uint8Array.from([...encodedPrefix, ...encodedTransferId])
  return findDerivedPair(rewardsProgramId, rewardManager, seeds)
}

const findProgramAddress = (programId: PublicKey, pubkey: PublicKey) => {
  return PublicKey.findProgramAddress([pubkey.toBytes().slice(0, 32)], programId)
}

// Finds a 'derived' address by finding a programAddress with
// seeds array  as first 32 bytes of base + seeds
// Returns [derivedAddress, bumpSeed]
const findDerivedAddress = (programId: PublicKey, base: PublicKey, seed: Uint8Array) => {
  return PublicKey.findProgramAddress([base.toBytes().slice(0, 32), seed], programId)
}

const findDerivedPair = async (programId: PublicKey, rewardManager: PublicKey, seed: Uint8Array): Promise<[PublicKey, PublicKey,number ]> => {
  // Finds the rewardManagerAuthority account by generating
  // a PDA with the rewardsMnager as a seed
  const [rewardManagerAuthority,] = await findProgramAddress(programId, rewardManager)
  const [derivedAddress, bumpSeed] = await findDerivedAddress(programId, rewardManagerAuthority, seed)
  return [rewardManagerAuthority, derivedAddress, bumpSeed]
}
