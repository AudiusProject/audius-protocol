const EthereumWallet = require('ethereumjs-wallet')
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

class Assignable {
  constructor (data) {
    Object.assign(this, data)
  }
}

class TrackData extends Assignable {}
class InstructionArgs extends Assignable {}
class InstructionEnum extends Assignable {}

const trackDataSchema = new Map([
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['user_id', 'string'],
        ['track_id', 'string'],
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
        ['track_data', TrackData],
        ['signature', [64]],
        ['recovery_id', 'u8']
      ]
    }
  ],
  [
    TrackData,
    {
      kind: 'struct',
      fields: [
        ['user_id', 'string'],
        ['track_id', 'string'],
        ['source', 'string'],
        ['timestamp', 'u64']
      ]
    }
  ]
])

let solanaConnection = new solanaWeb3.Connection(config.get('solanaEndpoint'))

// FeePayer Solana Wallet
let feePayer

function getFeePayer () {
  if (!feePayer) {
    feePayer = config.get('solanaFeePayerWallet') ? new solanaWeb3.Account(config.get('solanaFeePayerWallet')) : null
  }
  return feePayer
}

async function createAndVerifyMessage (
  validSigner,
  privateKey,
  userId,
  trackId
) {
  validSigner = validSigner || VALID_SIGNER

  let privKey = Buffer.from(privateKey, 'hex')
  // Recover wallet to pass as source
  const signerEthWallet = EthereumWallet.fromPrivateKey(privKey)
  const signerWalletAddress = signerEthWallet.getAddressString()
  let pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  let validSignerPubK = new solanaWeb3.PublicKey(validSigner)
  let accInfo = await solanaConnection.getAccountInfo(validSignerPubK)
  let signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  // Embed eth signer public key as source
  let trackData = new TrackData({
    user_id: userId,
    track_id: trackId,
    source: signerWalletAddress,
    timestamp: Math.round(new Date().getTime() / 1000)
  })

  const serializedTrackData = borsh.serialize(trackDataSchema, trackData)
  let msgHash = keccak256(serializedTrackData.toJSON().data)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  let instructionArgs = new InstructionArgs({
    track_data: trackData,
    signature: Array.from(sigObj.signature),
    recovery_id: sigObj.recid
  })

  let instructionData = new InstructionEnum({
    instruction: instructionArgs,
    choose: 'instruction'
  })

  const serializedInstructionArgs = borsh.serialize(
    instructionSchema,
    instructionData
  )

  let transaction = new solanaWeb3.Transaction()

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

  let feePayerAccount = getFeePayer()

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    solanaConnection,
    transaction,
    [feePayerAccount]
  )

  return signature
}

exports.createAndVerifyMessage = createAndVerifyMessage
