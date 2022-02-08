const config = require('./config')
const solanaWeb3 = require('@solana/web3.js')
const keccak256 = require('keccak256')
const secp256k1 = require('secp256k1')
const borsh = require('borsh')

const VALID_SIGNER = config.get('solanaValidSigner')
const AUDIUS_ETH_REGISTRY_PROGRAM = config.get('solanaAudiusEthRegistryAddress') ? new solanaWeb3.PublicKey(
  config.get('solanaAudiusEthRegistryAddress')
) : null
const TRACK_LISTEN_PROGRAM = config.get('solanaTrackListenCountAddress') ? new solanaWeb3.PublicKey(
  config.get('solanaTrackListenCountAddress')
) : null
const INSTRUCTIONS_PROGRAM = new solanaWeb3.PublicKey(
  'Sysvar1nstructions1111111111111111111111111'
)
const CLOCK_PROGRAM = new solanaWeb3.PublicKey(
  'SysvarC1ock11111111111111111111111111111111'
)

class TrackData {
  constructor ({ userId, trackId, source, timestamp }) {
    this.userId = userId
    this.trackId = trackId
    this.source = source
    this.timestamp = timestamp
  }
}

class InstructionArgs {
  constructor ({ trackData, signature, recoveryId }) {
    this.trackData = trackData
    this.signature = signature
    this.recoveryId = recoveryId
  }
}

class InstructionEnum {
  constructor ({ instruction, choose }) {
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

let feePayer

const feePayers = config.get('solanaFeePayerWallets')

// Optionally returns the existing singleFeePayer
// Ensures other usages of this function do not break as we upgrade to multiple
function getFeePayer (singleFeePayer = true) {
  if (!feePayer) {
    feePayer = config.get('solanaFeePayerWallet') ? solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(config.get('solanaFeePayerWallet'))) : null
  }
  // Ensure legacy usage of single feePayer is not broken
  // If multiple feepayers are not provided, default to single value as well
  if (singleFeePayer || feePayers === null || feePayers.length === 0) {
    return feePayer
  }

  const randomFeePayerIndex = Math.floor(Math.random() * feePayers.length)
  const randomFeePayer = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(feePayers[randomFeePayerIndex].privateKey))

  return randomFeePayer
}

async function createAndVerifyMessage (
  connection,
  validSigner,
  privateKey,
  userId,
  trackId,
  source
) {
  validSigner = validSigner || VALID_SIGNER

  let privKey = Buffer.from(privateKey, 'hex')
  let pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  let validSignerPubK = new solanaWeb3.PublicKey(validSigner)
  let accInfo = await connection.getAccountInfo(validSignerPubK)
  let signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  let trackData = new TrackData({
    userId: userId,
    trackId: trackId,
    source: source,
    timestamp: Math.round(new Date().getTime() / 1000)
  })

  const serializedTrackData = borsh.serialize(trackDataSchema, trackData)
  let msgHash = keccak256(serializedTrackData.toJSON().data)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  let instructionArgs = new InstructionArgs({
    trackData: trackData,
    signature: Array.from(sigObj.signature),
    recoveryId: sigObj.recid
  })

  let instructionData = new InstructionEnum({
    instruction: instructionArgs,
    choose: 'instruction'
  })

  const serializedInstructionArgs = borsh.serialize(
    instructionSchema,
    instructionData
  )

  let recentBlockHash = connection.getRecentBlockhash('confirmed')
  let transaction = new solanaWeb3.Transaction(recentBlockHash)

  let secpInstruction = solanaWeb3.Secp256k1Program.createInstructionWithPublicKey(
    {
      publicKey: pubKey,
      message: serializedTrackData.toJSON().data,
      signature: sigObj.signature,
      recoveryId: sigObj.recid
    }
  )

  transaction.add(secpInstruction)

  transaction.add({
    keys: [
      { pubkey: validSignerPubK, isSigner: false, isWritable: false },
      { pubkey: signerGroup, isSigner: false, isWritable: false },
      { pubkey: AUDIUS_ETH_REGISTRY_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: INSTRUCTIONS_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: CLOCK_PROGRAM, isSigner: false, isWritable: false }
    ],
    programId: TRACK_LISTEN_PROGRAM,
    data: serializedInstructionArgs
  })

  let feePayerAccount = getFeePayer(false)

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    connection,
    transaction,
    [feePayerAccount],
    {
      skipPreflight: false,
      commitment: config.get('solanaTxCommitmentLevel'),
      preflightCommitment: config.get('solanaTxCommitmentLevel')
    }
  )

  return signature
}

exports.createAndVerifyMessage = createAndVerifyMessage
exports.getFeePayer = getFeePayer
