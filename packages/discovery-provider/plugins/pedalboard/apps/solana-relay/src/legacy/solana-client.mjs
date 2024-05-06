import { PublicKey, Keypair, Secp256k1Program, TransactionInstruction } from '@solana/web3.js'
import keccak256 from 'keccak256'
import { publicKeyCreate, ecdsaSign } from 'secp256k1'
import { serialize } from 'borsh'

import { INSTRUCTIONS_PROGRAM, CLOCK_PROGRAM } from '../constants'
import { config } from '../config'

const VALID_SIGNER = config.validSigner
const AUDIUS_ETH_REGISTRY_PROGRAM = config.ethRegistryAddress
const TRACK_LISTEN_PROGRAM = config.trackListenCountProgramId

const ipdataAPIKey = config.ipdataApiKey

let feePayerKeypair = null
let feePayerKeypairs = config.solanaFeePayerWallets

class TrackData {
  constructor({ userId, trackId, source, timestamp }) {
    this.userId = userId
    this.trackId = trackId
    this.source = source
    this.timestamp = timestamp
  }
}

class InstructionArgs {
  constructor({ trackData, signature, recoveryId }) {
    this.trackData = trackData
    this.signature = signature
    this.recoveryId = recoveryId
  }
}

class InstructionEnum {
  constructor({ instruction, choose }) {
    this.instruction = instruction
    this.choose = choose
  }
}

const trackDataSchema = new Map([
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['userId', 'string'],
        ['trackId', 'string'],
        ['source', 'string'],
        ['timestamp', 'u64']
      ]
    }
  ]
])

const instructionSchema = new Map([
  [
    InstructionEnum,
    {
      kind: 'enum',
      field: 'choose',
      values: [['instruction', InstructionArgs]]
    }
  ],
  [
    InstructionArgs,
    {
      kind: 'struct',
      fields: [
        ['trackData', TrackData],
        ['signature', [64]],
        ['recoveryId', 'u8']
      ]
    }
  ],
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['userId', 'string'],
        ['trackId', 'string'],
        ['source', 'string'],
        ['timestamp', 'u64']
      ]
    }
  ]
])

// Optionally returns the existing singleFeePayer
// Ensures other usages of this function do not break as we upgrade to multiple
export const getFeePayerKeypair = async (singleFeePayer = true) => {
  if (!feePayerKeypair) {
    feePayerKeypair = (feePayerKeypairs && feePayerKeypairs[0]) || null
  }
  // Ensure legacy usage of single feePayer is not broken
  // If multiple feepayers are not provided, default to single value as well
  if (
    singleFeePayer ||
    feePayerKeypairs === null ||
    feePayerKeypairs.length === 0
  ) {
    return feePayerKeypair
  }

  const randomFeePayerIndex = Math.floor(
    Math.random() * feePayerKeypairs.length
  )
  return feePayerKeypairs[randomFeePayerIndex]
}

let cachedListenBlocktime = null // in seconds, tracks recent blocktime
let lastRetrievedListenBlocktime = null // in seconds, tracks time when cachedListenBlocktime was fetched

/**
 * Get the blocktime for a recently finalized block, this relative time will be passed into listen transaction.
 * Used to prevent clock skew errors when sol chain halts and sol clock diverges from real clock
 * @param {Object} connection initialized solana connection object
 * @returns Number epoch in seconds
 */
export const getListenTimestamp = async (connection) => {
  const currentEpochInSec = Math.round(Date.now() / 1000)
  if (
    cachedListenBlocktime &&
    Math.abs(lastRetrievedListenBlocktime - currentEpochInSec) < 30
  ) {
    return cachedListenBlocktime
  }

  const slot = await connection.getSlot('finalized')
  const blockTime = await connection.getBlockTime(slot)

  // update cached values
  cachedListenBlocktime = blockTime
  lastRetrievedListenBlocktime = currentEpochInSec

  return blockTime
}

export const createTrackListenInstructions = async ({
  privateKey,
  userId,
  trackId,
  source,
  location,
  connection
}) => {
  const validSigner = VALID_SIGNER

  const privKey = Buffer.from(privateKey, 'hex')
  const pubKey = publicKeyCreate(privKey, false).slice(1)

  const validSignerPubK = new PublicKey(validSigner)
  const accInfo = await connection.getAccountInfo(validSignerPubK)
  const signerGroup = new PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  let sourceData
  if (ipdataAPIKey) {
    sourceData = JSON.stringify({ source: source, location: location })
  } else {
    sourceData = source
  }

  // max sol tx size is 1232 bytes
  const trackData = new TrackData({
    userId: userId,
    trackId: trackId,
    source: sourceData, // use api key as feature flag
    timestamp:
      (await getListenTimestamp(connection)) ||
      Math.round(new Date().getTime() / 1000)
  })

  const serializedTrackData = serialize(trackDataSchema, trackData)
  const msgHash = keccak256(serializedTrackData.toJSON().data)

  const sigObj = ecdsaSign(Uint8Array.from(msgHash), privKey)

  const instructionArgs = new InstructionArgs({
    trackData: trackData,
    signature: Array.from(sigObj.signature),
    recoveryId: sigObj.recid
  })

  const instructionData = new InstructionEnum({
    instruction: instructionArgs,
    choose: 'instruction'
  })

  const serializedInstructionArgs = serialize(
    instructionSchema,
    instructionData
  )

  const secpInstruction =
    Secp256k1Program.createInstructionWithPublicKey({
      publicKey: pubKey,
      message: serializedTrackData.toJSON().data,
      signature: sigObj.signature,
      recoveryId: sigObj.recid
    })
  const listenInstruction = new TransactionInstruction({
    keys: [
      { pubkey: validSignerPubK, isSigner: false, isWritable: false },
      { pubkey: signerGroup, isSigner: false, isWritable: false },
      {
        pubkey: AUDIUS_ETH_REGISTRY_PROGRAM,
        isSigner: false,
        isWritable: false
      },
      { pubkey: INSTRUCTIONS_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: CLOCK_PROGRAM, isSigner: false, isWritable: false }
    ],
    programId: TRACK_LISTEN_PROGRAM,
    data: serializedInstructionArgs
  })

  return [secpInstruction, listenInstruction]
}
