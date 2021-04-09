const config = require('./config')
const solanaWeb3 = require('@solana/web3.js')
const crypto = require('crypto')
const keccak256 = require('keccak256')
const secp256k1 = require('secp256k1')
const { privateToAddress } = require('ethereumjs-util')
const borsh = require('borsh')

let SIGNER_GROUP_SIZE = 33
let VALID_SIGNER_SIZE = 53
let VALID_SIGNER = config.get('solanaValidSigner')
let AUDIUS_PROGRAM = new solanaWeb3.PublicKey(
  config.get('solanaProgramAddress')
)
let CREATE_AND_VERIFY_PROGRAM = new solanaWeb3.PublicKey(
  config.get('solanaCreateAndVerifyAddress')
)
let INSTRUCTIONS_PROGRAM = new solanaWeb3.PublicKey(
  'Sysvar1nstructions1111111111111111111111111'
)

let feePayer = new solanaWeb3.Account(config.get('solanaFeePayerWallet'))
let owner = new solanaWeb3.Account(config.get('solanaOwnerWallet'))

class Assignable {
  constructor (data) {
    Object.assign(this, data)
  }
}

class TrackData extends Assignable {}
class InstructionArgs extends Assignable {}
class InstructionEnum extends Assignable {}

// let url = solanaWeb3.clusterApiUrl("devnet", false);
let url = 'https://devnet.solana.com'

let devnetConnection = new solanaWeb3.Connection(url)

function newProgramAccount (newAccount, lamports, space) {
  let instruction = solanaWeb3.SystemProgram.createAccount({
    fromPubkey: feePayer.publicKey,
    newAccountPubkey: newAccount.publicKey,
    lamports,
    space, // data space
    programId: AUDIUS_PROGRAM
  })

  return instruction
}

async function createSignerGroup () {
  let newSignerGroup = new solanaWeb3.Account()
  console.log(
    'New signer group account creating: ',
    newSignerGroup.publicKey.toString()
  )
  let accountCreatingInstruction = newProgramAccount(
    newSignerGroup,
    10000000,
    SIGNER_GROUP_SIZE
  )

  let transaction = new solanaWeb3.Transaction()
  transaction.add(accountCreatingInstruction)

  transaction.add({
    keys: [
      { pubkey: newSignerGroup.publicKey, isSigner: false, isWritable: true },
      { pubkey: owner.publicKey, isSigner: false, isWritable: false }
    ],
    programId: AUDIUS_PROGRAM,
    data: [0]
  })

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    devnetConnection,
    transaction,
    [feePayer, newSignerGroup]
  )

  console.log('Signature: ', signature)
}

async function createValidSigner (signerGroup) {
  let privKey
  do {
    privKey = crypto.randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  let ethAddress = privateToAddress(Buffer.from(privKey))
  let ethAddressArr = ethAddress.toJSON().data

  console.log('Created private key: ', privKey.toString('hex'))
  console.log('Ethereum address: ', ethAddress.toString('hex'))

  let newValidSigner = new solanaWeb3.Account()
  console.log(
    'New valid signer account creating: ',
    newValidSigner.publicKey.toString()
  )

  let accountCreatingInstruction = newProgramAccount(
    newValidSigner,
    100000000,
    VALID_SIGNER_SIZE
  )

  let transaction = new solanaWeb3.Transaction()
  transaction.add(accountCreatingInstruction)

  let instructionData = [1].concat(ethAddressArr)

  let signerGroupPubK = new solanaWeb3.PublicKey(signerGroup)

  transaction.add({
    keys: [
      { pubkey: newValidSigner.publicKey, isSigner: false, isWritable: true },
      { pubkey: signerGroupPubK, isSigner: false, isWritable: false },
      { pubkey: owner.publicKey, isSigner: true, isWritable: false }
    ],
    programId: AUDIUS_PROGRAM,
    data: instructionData
  })

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    devnetConnection,
    transaction,
    [feePayer, newValidSigner, owner]
  )

  console.log('Signature: ', signature)
}

async function validateSignature (validSigner, privateKey, message) {
  validSigner = validSigner || VALID_SIGNER

  let privKey = Buffer.from(privateKey, 'hex')
  let pubKey = secp256k1.publicKeyCreate(privKey, false).slice(1)

  let validSignerPubK = new solanaWeb3.PublicKey(validSigner)
  let accInfo = await devnetConnection.getAccountInfo(validSignerPubK)
  let signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  let msg = Buffer.from(message).toJSON().data

  let msgHash = keccak256(msg)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  let transaction = new solanaWeb3.Transaction()
  let instructionData = [3]
  instructionData = instructionData.concat(Array.from(sigObj.signature))
  instructionData = instructionData.concat([sigObj.recid])
  instructionData = instructionData.concat(msg)

  let secpInstruction = solanaWeb3.Secp256k1Program.createInstructionWithPublicKey(
    {
      publicKey: pubKey,
      message: msg,
      signature: sigObj.signature,
      recoveryId: sigObj.recid
    }
  )

  transaction.add(secpInstruction)

  transaction.add({
    keys: [
      { pubkey: validSignerPubK, isSigner: false, isWritable: false },
      { pubkey: signerGroup, isSigner: false, isWritable: false },
      { pubkey: INSTRUCTIONS_PROGRAM, isSigner: false, isWritable: false }
    ],
    programId: AUDIUS_PROGRAM,
    data: Buffer.from(instructionData)
  })

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    devnetConnection,
    transaction,
    [feePayer]
  )

  console.log('Signature: ', signature)
}

async function createAndVerifyMessage (
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
  let accInfo = await devnetConnection.getAccountInfo(validSignerPubK)
  let signerGroup = new solanaWeb3.PublicKey(
    accInfo.data.toJSON().data.slice(1, 33)
  ) // cut off version and eth address from valid signer data

  let trackData = new TrackData({
    user_id: userId,
    track_id: trackId,
    source: source
  })
  let trackDataSchema = new Map([
    [
      TrackData,
      {
        kind: 'struct',
        fields: [
          ['user_id', 'string'],
          ['track_id', 'string'],
          ['source', 'string']
        ]
      }
    ]
  ])

  const serializedTrackData = borsh.serialize(trackDataSchema, trackData)
  let msgHash = keccak256(serializedTrackData.toJSON().data)

  const sigObj = secp256k1.ecdsaSign(Uint8Array.from(msgHash), privKey)

  let instructionSchema = new Map([
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
          ['source', 'string']
        ]
      }
    ]
  ])

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
      { pubkey: AUDIUS_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: INSTRUCTIONS_PROGRAM, isSigner: false, isWritable: false }
    ],
    programId: CREATE_AND_VERIFY_PROGRAM,
    data: serializedInstructionArgs
  })
  console.log(`Sending to ${CREATE_AND_VERIFY_PROGRAM}`)

  let signature = await solanaWeb3.sendAndConfirmTransaction(
    devnetConnection,
    transaction,
    [feePayer]
  )

  console.log('Signature: ', signature)
}

exports.createSignerGroup = createSignerGroup
exports.createValidSigner = createValidSigner
exports.validateSignature = validateSignature
exports.createAndVerifyMessage = createAndVerifyMessage
