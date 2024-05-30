import {
  Connection,
  Keypair,
  PublicKey,
  Secp256k1Program,
  TransactionInstruction
} from '@solana/web3.js'
import { serialize } from 'borsh'
import keccak256 from 'keccak256'
import { Logger } from 'pino'
import secp256k1 from 'secp256k1'

import { ClockProgram, InstructionsProgram, config } from '../../config'
import { connections } from '../../utils/connections'
import { LocationData } from '../../utils/ipData'

class TrackData {
  userId: string
  trackId: string
  source: string
  timestamp: number
  constructor({
    userId,
    trackId,
    source,
    timestamp
  }: {
    userId: string
    trackId: string
    source: string
    timestamp: number
  }) {
    this.userId = userId
    this.trackId = trackId
    this.source = source
    this.timestamp = timestamp
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

class InstructionArgs {
  trackData: TrackData
  signature: number[]
  recoveryId: number
  constructor({
    trackData,
    signature,
    recoveryId
  }: {
    trackData: TrackData
    signature: number[]
    recoveryId: number
  }) {
    this.trackData = trackData
    this.signature = signature
    this.recoveryId = recoveryId
  }
}

class InstructionEnum {
  instruction: InstructionArgs
  choose: string
  constructor({
    instruction,
    choose
  }: {
    instruction: InstructionArgs
    choose: string
  }) {
    this.instruction = instruction
    this.choose = choose
  }
}

// @ts-expect-error instructionSchema doesn't have correct type when converted from js
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

let cachedListenBlocktime: number | null = null
let lastRetrievedListenBlocktime: number | null = null

async function getListenTimestamp(connection: Connection) {
  const currentEpochInSec = Math.round(Date.now() / 1000)
  if (
    cachedListenBlocktime &&
    lastRetrievedListenBlocktime &&
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

export function getFeePayerKeyPair(): Keypair {
  const feePayers = config.solanaFeePayerWallets
  const randomFeePayerIndex = Math.floor(Math.random() * feePayers.length)
  return feePayers[randomFeePayerIndex]
}

export async function createTrackListenInstructions({
  logger,
  userId,
  trackId,
  location
}: {
  logger: Logger
  userId: string
  trackId: string
  location: LocationData
}): Promise<TransactionInstruction[]> {
  const trackListenProgram = new PublicKey(config.trackListenCountProgramId)
  const ethRegistryProgram = new PublicKey(config.ethRegistryProgramId)
  const validSignerPubK = new PublicKey(config.listensValidSigner)
  const privKey = Buffer.from(config.solanaSignerPrivateKey, 'hex')
  const pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  logger.info(
    { trackListenProgram, ethRegistryProgram, validSignerPubK },
    'ids and keys'
  )

  const connection = connections[0]
  const source = 'relay'

  const accInfo = await connection.getAccountInfo(validSignerPubK)
  const accPublicKeyInit = accInfo?.data.toJSON().data.slice(1, 33)

  logger.info({ accInfo }, 'account info')

  if (accPublicKeyInit === undefined) {
    throw new Error('pub key not found for acc info')
  }

  const signerGroup = new PublicKey(accPublicKeyInit)

  const sourceData =
    location === null ? source : JSON.stringify({ source, location })

  const trackData = new TrackData({
    userId,
    trackId,
    source: sourceData,
    timestamp:
      (await getListenTimestamp(connection)) ||
      Math.round(new Date().getTime() / 1000)
  })

  logger.info({ signerGroup, sourceData, trackData }, 'some data')

  const serializedTrackData = serialize(trackDataSchema, trackData)
  const buffered = Buffer.from(serializedTrackData)
  const msgHash = keccak256(buffered)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  const instructionArgs = new InstructionArgs({
    trackData,
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

  logger.info({ serializedTrackData, serializedInstructionArgs }, 'serialized')

  const secpInstruction = Secp256k1Program.createInstructionWithPublicKey({
    publicKey: pubKey,
    message: serializedTrackData,
    signature: sigObj.signature,
    recoveryId: sigObj.recid
  })

  const listenInstruction = new TransactionInstruction({
    keys: [
      { pubkey: validSignerPubK, isSigner: false, isWritable: false },
      { pubkey: signerGroup, isSigner: false, isWritable: false },
      {
        pubkey: ethRegistryProgram,
        isSigner: false,
        isWritable: false
      },
      { pubkey: InstructionsProgram, isSigner: false, isWritable: false },
      { pubkey: ClockProgram, isSigner: false, isWritable: false }
    ],
    programId: trackListenProgram,
    data: Buffer.from(serializedInstructionArgs)
  })

  return [secpInstruction, listenInstruction]
}
