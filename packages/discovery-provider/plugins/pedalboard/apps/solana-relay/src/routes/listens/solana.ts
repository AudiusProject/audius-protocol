import solanaWeb3, { Connection } from '@solana/web3.js'
import keccak256 from 'keccak256'
import secp256k1 from 'secp256k1'
import borsh from "borsh"
import { LocationData } from './types'
import { config } from '../../config'

const VALID_SIGNER = config.get('solanaValidSigner')
const AUDIUS_ETH_REGISTRY_PROGRAM = config.get('solanaAudiusEthRegistryAddress')
  ? new solanaWeb3.PublicKey(config.get('solanaAudiusEthRegistryAddress'))
  : null
const TRACK_LISTEN_PROGRAM = config.get('solanaTrackListenCountAddress')
  ? new solanaWeb3.PublicKey(config.get('solanaTrackListenCountAddress'))
  : null
const INSTRUCTIONS_PROGRAM = new solanaWeb3.PublicKey(
  'Sysvar1nstructions1111111111111111111111111'
)
const CLOCK_PROGRAM = new solanaWeb3.PublicKey(
  'SysvarC1ock11111111111111111111111111111111'
)

class TrackData {
    userId: string
    trackId: string
    source: string
    timestamp: number

  constructor({ userId, trackId, source, timestamp }: { userId: string, trackId: string, source: string, timestamp: number}) {
    this.userId = userId
    this.trackId = trackId
    this.source = source
    this.timestamp = timestamp
  }
}

class InstructionArgs {
  trackData: TrackData
  signature: string
  recoveryId: number

  constructor({ trackData, signature, recoveryId }: { trackData: TrackData, signature: string, recoveryId: number}) {
    this.trackData = trackData
    this.signature = signature
    this.recoveryId = recoveryId
  }
}

class InstructionEnum {
  instruction: InstructionArgs
  choose: string
  constructor({ instruction, choose }: { instruction: InstructionArgs, choose: string}) {
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

const instructionSchema = new Map<any, any>([
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

let feePayerKeypair = null
let feePayerKeypairs = null

// Optionally returns the existing singleFeePayer
// Ensures other usages of this function do not break as we upgrade to multiple
export const getFeePayerKeypair = (singleFeePayer = true) => {
  if (!feePayerKeypairs) {
    feePayerKeypairs = config.get('solanaFeePayerWallets')
      ? config
          .get('solanaFeePayerWallets')
          .map((item) => item.privateKey)
          .map((key) => solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(key)))
      : null
  }
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

let cachedListenBlocktime: number | null = null // in seconds, tracks recent blocktime
let lastRetrievedListenBlocktime: number | null = null // in seconds, tracks time when cachedListenBlocktime was fetched

/**
 * Get the blocktime for a recently finalized block, this relative time will be passed into listen transaction.
 * Used to prevent clock skew errors when sol chain halts and sol clock diverges from real clock
 * @param {Object} connection initialized solana connection object
 * @returns Number epoch in seconds
 */
const getListenTimestamp = async (connection: Connection) => {
  const currentEpochInSec = Math.round(Date.now() / 1000)
  if (
    cachedListenBlocktime && lastRetrievedListenBlocktime && 
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
}: { privateKey: string, userId: string, trackId: string, source: string, location: LocationData, connection: Connection}) {
  const validSigner = VALID_SIGNER

  const privKey = Buffer.from(privateKey, 'hex')
  const pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  const validSignerPubK = new solanaWeb3.PublicKey(validSigner)
  const accInfo = await connection.getAccountInfo(validSignerPubK)
  if (accInfo === null) throw new Error("accInfo null")
  const signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  // if api key present add location data to source
  const sourceData = config.ipdataApiKey !== "" ? JSON.stringify({ source: source, location: location }) : source

  // max sol tx size is 1232 bytes
  const trackData = new TrackData({
    userId: userId,
    trackId: trackId,
    source: sourceData,
    timestamp:
      (await getListenTimestamp(connection)) ||
      Math.round(new Date().getTime() / 1000)
  })

  const serializedTrackData = borsh.serialize(trackDataSchema, trackData)
  // @ts-ignore
  const msgHashData = JSON.stringify(Array.from(serializedTrackData))
  const msgHash = keccak256(msgHashData)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  const instructionArgs = new InstructionArgs({
    trackData: trackData,
    signature: Array.from(sigObj.signature),
    recoveryId: sigObj.recid
  })

  const instructionData = new InstructionEnum({
    instruction: instructionArgs,
    choose: 'instruction'
  })

  const serializedInstructionArgs = borsh.serialize(
    instructionSchema,
    instructionData
  )

  const message = JSON.stringify(Array.from(serializedTrackData))
  const secpInstruction =
    solanaWeb3.Secp256k1Program.createInstructionWithPublicKey({
      publicKey: pubKey,
      message,
      signature: sigObj.signature,
      recoveryId: sigObj.recid
    })
  const listenInstruction = new solanaWeb3.TransactionInstruction({
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
