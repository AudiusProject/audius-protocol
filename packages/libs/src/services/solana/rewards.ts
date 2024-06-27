import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  ComputeBudgetProgram,
  PublicKey,
  Secp256k1Program,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'
import { serialize } from 'borsh'

import type { Logger, Nullable } from '../../utils'
import type { IdentityService } from '../identity'

import { SolanaUtils } from './SolanaUtils'
import { RewardsManagerError } from './errors'
import type { TransactionHandler } from './transactionHandler'
import { getBankAccountAddress } from './userBank'

// Various prefixes used for rewards
const SENDER_SEED_PREFIX = 'S_'
const VERIFY_TRANSFER_SEED_PREFIX = 'V_'
const TRANSFER_PREFIX = 'T_'
const ADD_SENDER_MESSAGE_PREFIX = 'add'

// Enum cases for instructions
const CREATE_SENDER_PUBLIC_ENUM_VALUE = 4
const SUBMIT_INSTRUCTION_ENUM_VALUE = 6
const EVALUATE_INSTRUCTION_ENUM_VALUE = 7

const ATTESTATION_INSTRUCTIONS_PER_TRANSACTION = 4

const encoder = new TextEncoder()

class SubmitAttestationInstructionData {
  id: string
  constructor({ transferId }: { transferId: string }) {
    this.id = transferId
  }
}

const submitAttestationInstructionSchema = new Map([
  [
    SubmitAttestationInstructionData,
    {
      kind: 'struct',
      fields: [['id', 'string']]
    }
  ]
])

type ValidateAttestationsInstructionDataConfig = {
  amount: number
  id: string
  ethRecipient: Uint8Array
}

class ValidateAttestationsInstructionData {
  amount: number
  id: string
  eth_recipient: Uint8Array

  constructor({
    amount,
    id,
    ethRecipient
  }: ValidateAttestationsInstructionDataConfig) {
    this.amount = amount
    this.id = id
    this.eth_recipient = ethRecipient
  }
}

const validateAttestationsInstructionSchema = new Map([
  [
    ValidateAttestationsInstructionData,
    {
      kind: 'struct',
      fields: [
        ['amount', 'u64'],
        ['id', 'string'],
        ['eth_recipient', [20]]
      ]
    }
  ]
])

class CreateSenderPublicInstructionData {
  eth_address: Uint8Array
  operator: Uint8Array

  constructor({
    ethAddress,
    operator
  }: {
    ethAddress: Uint8Array
    operator: Uint8Array
  }) {
    this.eth_address = ethAddress
    this.operator = operator
  }
}

const createSenderPublicInstructionSchema = new Map([
  [
    CreateSenderPublicInstructionData,
    {
      kind: 'struct',
      fields: [
        ['eth_address', [20]],
        ['operator', [20]]
      ]
    }
  ]
])

export type AttestationMeta = {
  ethAddress: string
  signature: string
}

export type SubmitAttestationsConfig = {
  rewardManagerProgramId: PublicKey
  rewardManagerAccount: PublicKey
  attestations: AttestationMeta[]
  oracleAttestation: AttestationMeta
  challengeId: string
  specifier: string
  feePayer: PublicKey
  attestationSignature?: string
  recipientEthAddress: string
  tokenAmount: BN
  transactionHandler: TransactionHandler
  instructionsPerTransaction?: number
  logger: Logger
}

export async function submitAttestations({
  rewardManagerProgramId,
  rewardManagerAccount,
  attestations,
  oracleAttestation,
  challengeId,
  specifier,
  feePayer,
  recipientEthAddress,
  tokenAmount,
  transactionHandler,
  instructionsPerTransaction = ATTESTATION_INSTRUCTIONS_PER_TRANSACTION,
  logger = console
}: SubmitAttestationsConfig) {
  // Construct combined transfer ID
  const transferId = SolanaUtils.constructTransferId(challengeId, specifier)

  // Derive the message account we'll use to store the attestations
  const [rewardManagerAuthority, derivedMessageAccount] =
    await deriveMessageAccount(
      transferId,
      rewardManagerProgramId,
      rewardManagerAccount
    )

  const encodedSenderMessage = SolanaUtils.constructAttestation(
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAttestation.ethAddress
  )

  // Add instructions from DN attestations - each attestation
  // needs a pairing of SECP recovery instruction and submit
  // attestation instruction.
  let instructions: TransactionInstruction[] = await Promise.all(
    attestations.reduce<Array<Promise<TransactionInstruction>>>(
      (instructions, meta, i) => {
        const secpInstruction = Promise.resolve(
          generateAttestationSecpInstruction({
            attestationMeta: meta,
            instructionIndex: (2 * i) % instructionsPerTransaction,
            encodedSenderMessage
          })
        )
        const verifyInstruction = generateSubmitAttestationInstruction({
          attestationMeta: meta,
          derivedMessageAccount,
          rewardManagerAccount,
          rewardManagerProgramId,
          rewardManagerAuthority,
          transferId,
          feePayer
        })
        return [...instructions, secpInstruction, verifyInstruction]
      },
      []
    )
  )

  const encodedOracleMessage = SolanaUtils.constructAttestation(
    recipientEthAddress,
    tokenAmount,
    transferId
  )

  // Add instructions from oracle attestation
  const oracleSecp = generateAttestationSecpInstruction({
    attestationMeta: oracleAttestation,
    instructionIndex: instructions.length % instructionsPerTransaction,
    encodedSenderMessage: encodedOracleMessage
  })

  const oracleTransfer = await generateSubmitAttestationInstruction({
    attestationMeta: oracleAttestation,
    derivedMessageAccount,
    rewardManagerAccount,
    rewardManagerProgramId,
    rewardManagerAuthority,
    transferId,
    feePayer
  })

  // Break the instructions up into multiple transactions as per `instructionsPerTransaction`
  instructions = [...instructions, oracleSecp, oracleTransfer]
  const bucketedInstructions: TransactionInstruction[][] = instructions.reduce<
    TransactionInstruction[][]
  >(
    (acc, cur) => {
      const instruction = acc[acc.length - 1]
      if (instruction && instruction.length < instructionsPerTransaction) {
        instruction.push(cur)
      } else {
        acc.push([cur])
      }
      return acc
    },
    [[]]
  )

  const results = await Promise.all(
    bucketedInstructions.map(
      async (i) =>
        await transactionHandler.handleTransaction({
          instructions: [
            ...i,
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: 100000
            })
          ],
          errorMapping: RewardsManagerError,
          logger,
          skipPreflight: false,
          feePayerOverride: feePayer,
          sendBlockhash: false
        })
    )
  )
  logger.info(
    `submitAttestations: submitted attestations with results: ${JSON.stringify(
      results
    )}`
  )

  // If there's any error in any of the transactions, just return that one
  for (const res of results) {
    if (res.error ?? res.errorCode) {
      return res
    }
  }
  return results[0]
}

export type CreateSenderParams = {
  rewardManagerProgramId: PublicKey
  rewardManagerAccount: PublicKey
  senderEthAddress: string
  feePayer: PublicKey
  operatorEthAddress: string
  attestations: AttestationMeta[]
  identityService: Nullable<IdentityService>
  transactionHandler: TransactionHandler
}

/**
 * Creates a new rewards signer (one that can attest)
 */
export async function createSender({
  rewardManagerProgramId,
  rewardManagerAccount,
  senderEthAddress,
  feePayer,
  operatorEthAddress,
  attestations,
  transactionHandler
}: CreateSenderParams) {
  const [rewardManagerAuthority] =
    await SolanaUtils.findProgramAddressFromPubkey(
      rewardManagerProgramId,
      rewardManagerAccount
    )

  const encodedSenderMessage = constructCreateSenderMessage(
    senderEthAddress,
    rewardManagerAccount
  )
  const signerEthAddresses = attestations.map((meta) => meta.ethAddress)
  const signerInstructions = attestations.map((meta, i) => {
    return generateCreateSenderSecpInstruction({
      attestationMeta: meta,
      instructionIndex: i,
      encodedSenderMessage
    })
  })

  const createSenderInstruction = await generateCreateSenderInstruction({
    senderEthAddress,
    operatorEthAddress,
    rewardManagerAccount,
    rewardManagerAuthority,
    rewardManagerProgramId,
    feePayer,
    signerEthAddresses
  })

  const instructions = [
    ...signerInstructions,
    createSenderInstruction,
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100000
    })
  ]
  return await transactionHandler.handleTransaction({
    instructions,
    errorMapping: RewardsManagerError,
    feePayerOverride: feePayer
  })
}

export type EvaluateAttestationsConfig = {
  rewardManagerProgramId: PublicKey
  rewardManagerAccount: PublicKey
  rewardManagerTokenSource: PublicKey
  challengeId: string
  specifier: string
  recipientEthAddress: string
  userBankProgramAccount: PublicKey
  oracleEthAddress: string
  feePayer: PublicKey
  tokenAmount: BN
  transactionHandler: TransactionHandler
  logger: Logger
}

/**
 * Evaluates previously submitted attestations, disbursing if successful.
 */
export const evaluateAttestations = async ({
  rewardManagerProgramId,
  rewardManagerAccount,
  rewardManagerTokenSource,
  challengeId,
  specifier,
  recipientEthAddress,
  userBankProgramAccount,
  oracleEthAddress,
  feePayer,
  tokenAmount,
  transactionHandler,
  logger = console
}: EvaluateAttestationsConfig) => {
  // Get transfer ID
  const transferId = SolanaUtils.constructTransferId(challengeId, specifier)

  // Derive the messages account we previously stored attestations in
  const [rewardManagerAuthority, verifiedMessagesAccount] =
    await deriveMessageAccount(
      transferId,
      rewardManagerProgramId,
      rewardManagerAccount
    )
  // Derive the transfer account we'll use to represent + dedupe
  // the disbursement.
  const transferAccount = await deriveTransferAccount(
    transferId,
    rewardManagerProgramId,
    rewardManagerAccount
  )
  // Derive the recipient's Solana Userbank account
  // from their eth key
  const recipientBankAccount = await getBankAccountAddress(
    recipientEthAddress,
    userBankProgramAccount,
    TOKEN_PROGRAM_ID
  )

  // Derive the AAO's Solana pubkey from it's eth address
  const derivedAAOAddress = await deriveSolanaSenderFromEthAddress(
    oracleEthAddress,
    rewardManagerProgramId,
    rewardManagerAccount
  )

  // Construct the requried accounts

  ///   0. `[]` Verified messages
  ///   1. `[]` Reward manager
  ///   2. `[]` Reward manager authority
  ///   3. `[]` Reward token source
  ///   4. `[]` Reward token recipient
  ///   5. `[]` Transfer account
  ///   6. `[]` Bot oracle
  ///   7. `[]` Payer
  ///   8. `[]` Sysvar rent
  ///   9. `[]` Token program id
  ///  10. `[]` System program id
  const accounts = [
    {
      pubkey: verifiedMessagesAccount,
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
      pubkey: rewardManagerTokenSource,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: recipientBankAccount,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: transferAccount,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: derivedAAOAddress,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: feePayer,
      isSigner: true,
      isWritable: true
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }
  ]

  // Construct the instruction data
  const instructionData = new ValidateAttestationsInstructionData({
    amount: tokenAmount.toNumber(),
    id: transferId,
    ethRecipient: SolanaUtils.ethAddressToArray(recipientEthAddress)
  })
  const serializedInstructionData = serialize(
    validateAttestationsInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(EVALUATE_INSTRUCTION_ENUM_VALUE, ...serializedInstructionData)
  )
  const transferInstruction = new TransactionInstruction({
    keys: accounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })

  return await transactionHandler.handleTransaction({
    instructions: [
      transferInstruction,
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 100000
      })
    ],
    errorMapping: RewardsManagerError,
    logger,
    skipPreflight: false,
    feePayerOverride: feePayer,
    sendBlockhash: false
  })
}

// Helpers

// Generate particular instructions

type GenerateSubmitAttestationInstructionParams = {
  attestationMeta: AttestationMeta
  derivedMessageAccount: PublicKey
  rewardManagerAccount: PublicKey
  rewardManagerAuthority: PublicKey
  rewardManagerProgramId: PublicKey
  feePayer: PublicKey
  transferId: string
}

/**
 *
 * Helper function to generate a submit attestation instruction.
 */
const generateSubmitAttestationInstruction = async ({
  attestationMeta,
  derivedMessageAccount,
  rewardManagerAccount,
  rewardManagerAuthority,
  rewardManagerProgramId,
  feePayer,
  transferId
}: GenerateSubmitAttestationInstructionParams) => {
  // Get the DN's derived Solana address from the eth pubkey
  const derivedSender = await deriveSolanaSenderFromEthAddress(
    attestationMeta.ethAddress,
    rewardManagerProgramId,
    rewardManagerAccount
  )

  ///   Submit attestations
  ///   0. `[writable]` Verified messages - New or existing account PDA storing verified messages
  ///   1. `[]` Reward manager
  ///   2. `[]` Reward manager authority
  ///   3. `[signer]` Funder
  ///   4. `[]` Sender
  ///   5. `[]` Sysvar rent
  ///   6. `[]` Instruction info
  ///   7. `[]` System program id
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
      isSigner: false,
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

  const instructionData = new SubmitAttestationInstructionData({ transferId })
  const serializedInstructionData = serialize(
    submitAttestationInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(SUBMIT_INSTRUCTION_ENUM_VALUE, ...serializedInstructionData)
  )

  return new TransactionInstruction({
    keys: verifyInstructionAccounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })
}

/**
 * Encodes a given signature to a 64 byte array for SECP recovery
 */
const encodeSignature = (signature: string) => {
  // Perform signature manipulations:
  // - remove the 0x prefix for BN
  // - lose the final byte / recovery ID: the secp instruction constructor
  //   requires only 'r', 's' from the signature, while 'v', the recovery ID,
  //   is passed as a separate argument.
  //   https://medium.com/mycrypto/the-magic-of-digital-signatures-on-ethereum-98fe184dc9c7
  //
  let strippedSignature = signature.replace('0x', '')
  const recoveryIdStr = strippedSignature.slice(strippedSignature.length - 2)
  const recoveryId = new BN(recoveryIdStr, 'hex').toNumber()
  strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2)
  // Pad to 64 bytes - otherwise, signatures starting with '0' would result
  // in < 64 byte arrays
  const encodedSignature = Uint8Array.of(
    ...new BN(strippedSignature, 'hex').toArray('be', 64)
  )
  return { encodedSignature, recoveryId }
}

type GenerateAttestationSecpInstructionParams = {
  attestationMeta: AttestationMeta
  instructionIndex: number
  encodedSenderMessage: Uint8Array
}

const generateAttestationSecpInstruction = ({
  attestationMeta,
  instructionIndex,
  encodedSenderMessage
}: GenerateAttestationSecpInstructionParams) => {
  const { encodedSignature, recoveryId } = encodeSignature(
    attestationMeta.signature
  )

  return Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: SolanaUtils.ethAddressToArray(attestationMeta.ethAddress),
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
    instructionIndex
  })
}

type GenerateCreateSenderSecpInstructionConfig = {
  attestationMeta: AttestationMeta
  instructionIndex: number
  encodedSenderMessage: Uint8Array
}

const generateCreateSenderSecpInstruction = ({
  attestationMeta,
  instructionIndex,
  encodedSenderMessage
}: GenerateCreateSenderSecpInstructionConfig) => {
  const { encodedSignature, recoveryId } = encodeSignature(
    attestationMeta.signature
  )
  return Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: attestationMeta.ethAddress,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
    instructionIndex
  })
}

type GenerateCreateSenderInstructionConfig = {
  senderEthAddress: string
  operatorEthAddress: string
  rewardManagerAccount: PublicKey
  rewardManagerAuthority: PublicKey
  rewardManagerProgramId: PublicKey
  feePayer: PublicKey
  signerEthAddresses: string[]
}

/**
 *
 * Helper function generate a create sender instruction.
 */
const generateCreateSenderInstruction = async ({
  senderEthAddress,
  operatorEthAddress,
  rewardManagerAccount,
  rewardManagerAuthority,
  rewardManagerProgramId,
  feePayer,
  signerEthAddresses
}: GenerateCreateSenderInstructionConfig) => {
  // Get the DN's derived Solana address from the eth pubkey
  const derivedSenderSolanaAddress = await deriveSolanaSenderFromEthAddress(
    senderEthAddress,
    rewardManagerProgramId,
    rewardManagerAccount
  )

  const signerSolanaPubKeys = await Promise.all(
    signerEthAddresses.map(
      async (signerEthAddress) =>
        await deriveSolanaSenderFromEthAddress(
          signerEthAddress,
          rewardManagerProgramId,
          rewardManagerAccount
        )
    )
  )

  /// 0. `[]` Reward manager
  /// 1. `[]` Reward manager authority
  /// 2. `[signer]` Funder
  /// 3. `[writable]` new_sender
  /// 4. `[]` Bunch of senders which prove creating another one
  const createSenderInstructionAccounts = [
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
      pubkey: derivedSenderSolanaAddress,
      isSigner: false,
      isWritable: true
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    ...signerSolanaPubKeys.map((pubkey) => ({
      pubkey,
      isSigner: false,
      isWritable: false
    }))
  ]

  const createSenderPublicInstructionData =
    new CreateSenderPublicInstructionData({
      ethAddress: SolanaUtils.ethAddressToArray(senderEthAddress),
      operator: SolanaUtils.ethAddressToArray(operatorEthAddress)
    })
  const serializedInstructionData = serialize(
    createSenderPublicInstructionSchema,
    createSenderPublicInstructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(CREATE_SENDER_PUBLIC_ENUM_VALUE, ...serializedInstructionData)
  )

  return new TransactionInstruction({
    keys: createSenderInstructionAccounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })
}

// Misc

/**
 * Derives the Solana account associated with a given sender Eth address.
 */
export const deriveSolanaSenderFromEthAddress = async (
  ethAddress: string,
  rewardManagerProgramId: PublicKey,
  rewardManagerAccount: PublicKey
) => {
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  const [, derivedSender] = await SolanaUtils.findProgramAddressWithAuthority(
    rewardManagerProgramId,
    rewardManagerAccount,
    new Uint8Array([...encodedPrefix, ...ethAddressArr])
  )
  return derivedSender
}

/**
 * Constructs a create signer message for an existing "signer" eth address
 * @param {string} ethAddress
 * @returns {Uint8Array}
 */
const constructCreateSenderMessage = (
  ethAddress: string,
  rewardManagerAccount: PublicKey
) => {
  const encodedPrefix = encoder.encode(ADD_SENDER_MESSAGE_PREFIX)
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)
  const rewardManagerAccountArr = rewardManagerAccount.toBytes()

  const items = [encodedPrefix, rewardManagerAccountArr, ethAddressArr] as const
  const res = items.slice(1).reduce((prev, cur) => {
    return Uint8Array.of(...prev, ...cur)
  }, Uint8Array.from(items[0]))
  return res
}

/**
 * Derives the 'transfer account' - the account which represents a single successful disbursement
 * and is used to dedupe - from the transferId and other info
 */
const deriveTransferAccount = async (
  transferId: string,
  rewardProgramId: PublicKey,
  rewardManager: PublicKey
) => {
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_PREFIX),
    ...encoder.encode(transferId)
  ])
  const [, derivedAddress] = await SolanaUtils.findProgramAddressWithAuthority(
    rewardProgramId,
    rewardManager,
    seed
  )
  return derivedAddress
}

/**
 * Derives the account to store messages for a single challenge
 */
const deriveMessageAccount = async (
  transferId: string,
  rewardsProgramId: PublicKey,
  rewardManager: PublicKey
) => {
  const encodedPrefix = encoder.encode(VERIFY_TRANSFER_SEED_PREFIX)
  const encodedTransferId = encoder.encode(transferId)
  const seeds = Uint8Array.from([...encodedPrefix, ...encodedTransferId])
  return await SolanaUtils.findProgramAddressWithAuthority(
    rewardsProgramId,
    rewardManager,
    seeds
  )
}
