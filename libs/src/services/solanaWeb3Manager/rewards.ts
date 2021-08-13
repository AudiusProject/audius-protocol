import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { AccountMeta, Connection, PublicKey, Secp256k1Program, sendAndConfirmTransaction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js"
const borsh = require('borsh')
const {getBankAccountAddress} = require('./userBank')
const BN = require('bn.js')

/// Sender program account seed
const SENDER_SEED_PREFIX = "S_"
const VERIFY_TRANSFER_SEED_PREFIX = "V_"
const TRANSFER_PREFIX = "T_"
const DECIMALS = 9

const encoder = new TextEncoder()

class SubmitAttestationInstructionData {
  id: string
  /**
   *Creates an instance of SubmitAttestationInstructionData.
   * @param {{transferId: string}} {
   *     transferId
   *   }
   * @memberof SubmitAttestationInstructionData
   */
  constructor ({
    transferId
  }: {transferId: string}) {
    this.id = transferId
  }
}

const submitAttestationInstructionSchema = new Map([
  [
    SubmitAttestationInstructionData,
    {
      kind: 'struct',
      fields: [
        ['id', 'string']
      ]
    }
  ]
])

class ValidateAttestationsInstructionData {
  amount: number
  id: string
  eth_recipient: Uint8Array
  /**
   *Creates an instance of ValidateAttestationsInstructionData.
   * @param {{
   *     amount: number,
   *     id: string,
   *     eth_recipient: Uint8Array
   *   }} {
   *     amount,
   *     id,
   *     eth_recipient
   *   }
   * @memberof ValidateAttestationsInstructionData
   */
  constructor({
    amount,
    id,
    eth_recipient
  }: {
    amount: number,
    id: string,
    eth_recipient: Uint8Array
  }) {
    this.amount = amount
    this.id = id
    this.eth_recipient = eth_recipient
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
      ],
    }
  ]
])


/**
 * @typedef {Object} AttestationMeta
 * @property {string} ethAddress
 * @property {string} signature
 */

type AttestationMeta = {
  ethAddress: string
  signature: string
}

/**
 *
 *
 * @param {{
 *   rewardManagerProgramId: PublicKey,
 *   rewardManagerAccount: PublicKey,
 *   attestations: AttestationMeta[]
 *   oracleAttestation: AttestationMeta
 *   challengeId: string,
 *   specifier: string,
 *   feePayer: PublicKey,
 *   attestationSignature: string,
 *   recipientEthAddress: string,
 *   tokenAmount: number
 *   identityService: any
 *   connection: Connection
 * }} {
 *   rewardManagerProgramId,
 *   rewardManagerAccount,
 *   attestations,
 *   oracleAttestation,
 *   challengeId,
 *   specifier,
 *   feePayer,
 *   recipientEthAddress,
 *   tokenAmount,
 *   identityService,
 *   connection
 * }
 */
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
  identityService,
  connection
}: {
  rewardManagerProgramId: PublicKey,
  rewardManagerAccount: PublicKey,
  attestations: AttestationMeta[]
  oracleAttestation: AttestationMeta
  challengeId: string,
  specifier: string,
  feePayer: PublicKey,
  attestationSignature: string,
  recipientEthAddress: string,
  tokenAmount: number
  identityService: any
  connection: Connection
}) {
  const transferId = constructTransferId(challengeId, specifier)
  const [rewardManagerAuthority, derivedMessageAccount,] = await deriveMessageAccount(transferId, rewardManagerProgramId, rewardManagerAccount)

  // Add instructions from DN attestations
  let instructions = await Promise.all((attestations.reduce((instructions, meta, i) => {
    const verifyInstruction = generateVerifySignatureInstruction({
      attestationMeta: meta,
      derivedMessageAccount,
      rewardManagerAccount,
      rewardManagerProgramId,
      rewardManagerAuthority,
      transferId,
      feePayer
    })
    const secpInstruction = Promise.resolve(generateSecpInstruction({
      attestationMeta: meta,
      isOracle: false,
      recipientEthAddress,
      oracleAddress: oracleAttestation.ethAddress,
      tokenAmount,
      transferId,
      instructionIndex: 2 * i
    }))
    return [...instructions, secpInstruction, verifyInstruction]
  }, [] as Promise<TransactionInstruction>[])))

  // Add instructions from oracle
  const oracleSecp = await generateSecpInstruction({
    attestationMeta: oracleAttestation,
    recipientEthAddress,
    instructionIndex: instructions.length,
    transferId,
    isOracle: true,
    tokenAmount,
    oracleAddress: oracleAttestation.ethAddress
  })
  const oracleTransfer = await generateVerifySignatureInstruction({
    attestationMeta: oracleAttestation,
    derivedMessageAccount,
    rewardManagerAccount,
    rewardManagerProgramId,
    rewardManagerAuthority,
    transferId,
    feePayer
  })
  instructions = [...instructions, oracleSecp, oracleTransfer]
  const relayable = instructions.map(prepareInstructionForRelay)
  const {blockhash: recentBlockhash} = await connection.getRecentBlockhash()
  const transactionData = {
    recentBlockhash,
    instructions: relayable
  }

  try {
    const response = await identityService.solanaRelay(transactionData)
    return response
  } catch (e) {
    console.error(e.message)
    console.log({e})
  }
}

/**
 *
 *
 * @param {{
 *   rewardManagerProgramId: PublicKey
 *   rewardManagerAccount: PublicKey
 *   rewardManagerTokenSource: PublicKey
 *   challengeId: string
 *   specifier: string
 *   recipientEthAddress: string
 *   userBankProgramAccount: PublicKey,
 *   oracleEthAddress: string
 *   feePayer: PublicKey
 *   tokenAmount: number
 *   identityService: any
 *   connection: Connection
 * }} {
 *   rewardManagerProgramId,
 *   rewardManagerAccount,
 *   rewardManagerTokenSource,
 *   challengeId,
 *   specifier,
 *   recipientEthAddress,
 *   userBankProgramAccount,
 *   oracleEthAddress,
 *   feePayer,
 *   tokenAmount,
 *   identityService,
 *   connection
 * }
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
  identityService,
  connection
}: {
  rewardManagerProgramId: PublicKey
  rewardManagerAccount: PublicKey
  rewardManagerTokenSource: PublicKey
  challengeId: string
  specifier: string
  recipientEthAddress: string
  userBankProgramAccount: PublicKey,
  oracleEthAddress: string
  feePayer: PublicKey
  tokenAmount: number
  identityService: any
  connection: Connection
}) => {
  const transferId = constructTransferId(challengeId, specifier)
  const [rewardManagerAuthority, verifiedMessagesAccount,] = await deriveMessageAccount(transferId, rewardManagerProgramId, rewardManagerAccount)
  const transferAccount = await deriveTransferAccount(transferId, rewardManagerProgramId, rewardManagerAccount)
  const recipientBankAccount = await getBankAccountAddress(recipientEthAddress, userBankProgramAccount, TOKEN_PROGRAM_ID)
  const derivedBotAddress = await deriveSolanaSenderFromEthAddress(oracleEthAddress, rewardManagerProgramId, rewardManagerAccount)


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
  const accounts: AccountMeta[] = [
    {
      pubkey: verifiedMessagesAccount,
      isSigner: false,
      isWritable: true,
    }, {
      pubkey: rewardManagerAccount,
      isSigner: false,
      isWritable: false,
    }, {
      pubkey: rewardManagerAuthority,
      isSigner: false,
      isWritable: false,
    }, {
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
    }, {
      pubkey: derivedBotAddress,
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
    }, {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false
    }, {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }
  ]

  const instructionData = new ValidateAttestationsInstructionData({
    amount: padUIAmount(tokenAmount),
    id: transferId,
    eth_recipient: ethAddressToArray(recipientEthAddress)
  })
  const serializedInstructionData = borsh.serialize(validateAttestationsInstructionSchema, instructionData)
  const serializedInstructionEnum = Buffer.from(Uint8Array.of(
    5,
    ...serializedInstructionData
  ))
  const transferInstruction = new TransactionInstruction({
    keys: accounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })
  const relayable = prepareInstructionForRelay(transferInstruction)
  const {blockhash: recentBlockhash} = await connection.getRecentBlockhash()
  const transactionData = {
    recentBlockhash,
    instructions: relayable
  }

  try {
    const response = await identityService.solanaRelay(transactionData)
    return response
  } catch (e) {
    console.error(e.message)
    console.log({e})
  }
}

// Helpers

// Generate particular instructions

/**
 *
 *
 * @param {{
 *   attestationMeta: AttestationMeta,
 *   derivedMessageAccount: PublicKey
 *   rewardManagerAccount: PublicKey
 *   rewardManagerAuthority: PublicKey
 *   rewardManagerProgramId: PublicKey
 *   feePayer: PublicKey
 *   transferId: string
 * }} {
 *   attestationMeta,
 *   derivedMessageAccount,
 *   rewardManagerAccount,
 *   rewardManagerAuthority,
 *   rewardManagerProgramId,
 *   feePayer,
 *   transferId
 * }
 * @returns {Promise<TransactionInstruction>}
 */
const generateVerifySignatureInstruction = async ({
  attestationMeta,
  derivedMessageAccount,
  rewardManagerAccount,
  rewardManagerAuthority,
  rewardManagerProgramId,
  feePayer,
  transferId
}: {
  attestationMeta: AttestationMeta,
  derivedMessageAccount: PublicKey
  rewardManagerAccount: PublicKey
  rewardManagerAuthority: PublicKey
  rewardManagerProgramId: PublicKey
  feePayer: PublicKey
  transferId: string
}): Promise<TransactionInstruction> => {
  const derivedSender = await deriveSolanaSenderFromEthAddress(attestationMeta.ethAddress, rewardManagerProgramId, rewardManagerAccount)

  ///   Verify transfer signature
  ///
  ///   0. `[writable]` New or existing account storing verified messages
  ///   1. `[]` Reward manager
  ///   1. `[]` Reward manager authority (NEW)
  ///   1. `[]` fee payer (NEW)
  ///   2. `[]` Sender
  ///   2. `[]` sysvar rent (new)
  ///   3. `[]` Sysvar instruction id (NEW)
  const verifyInstructionAccounts: AccountMeta[] = [
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
  const serializedInstructionData = borsh.serialize(
    submitAttestationInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(Uint8Array.of(
    4,
    ...serializedInstructionData
  ))

  return new TransactionInstruction({
    keys: verifyInstructionAccounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum
  })
}

/**
 *
 * @param {{
 *   attestationMeta: AttestationMeta
 *   isOracle: boolean
 *   recipientEthAddress: string
 *   tokenAmount: number
 *   transferId: string
 *   oracleAddress: string
 *   instructionIndex: number
 * }} {
 *   attestationMeta,
 *   isOracle,
 *   recipientEthAddress,
 *   tokenAmount,
 *   transferId,
 *   oracleAddress,
 *   instructionIndex
 * }
 * @returns {TransactionInstruction}
 */
const generateSecpInstruction = ({
  attestationMeta,
  isOracle,
  recipientEthAddress,
  tokenAmount,
  transferId,
  oracleAddress,
  instructionIndex
}: {
  attestationMeta: AttestationMeta
  isOracle: boolean
  recipientEthAddress: string
  tokenAmount: number
  transferId: string
  oracleAddress: string
  instructionIndex: number
}): TransactionInstruction  => {
  // Perform signature manipulations:
  // - remove the 0x prefix, and then lose the final byte
  // ('1b', which is the recovery ID, and not desired by the `createInsturctionWithEthAddress` method)
  let strippedSignature = attestationMeta.signature.replace('0x', '')
  const recoveryIdStr = strippedSignature.slice(strippedSignature.length - 2)
  const recoveryId = new BN(recoveryIdStr, 'hex').toNumber()
  strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2)
  const encodedSignature = Uint8Array.of(
    ...new BN(strippedSignature, 'hex').toArray('be') // 0 pad to add length, but this seems wrong. Idk
  )

  const encodedSenderMessage = constructAttestation(isOracle, recipientEthAddress, tokenAmount, transferId, oracleAddress)

  return Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: attestationMeta.ethAddress,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
    instructionIndex
  })
}

// Misc

/**
 * @param {string} ethAddress
 * @returns {Uint8Array}
 */
const ethAddressToArray = (ethAddress: string): Uint8Array => {
  const strippedEthAddress = ethAddress.replace('0x', '')
  return Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )
}

/**
 * @param {string} challengeId
 * @param {string} specifier
 * @returns {string}
 */
const constructTransferId = (challengeId: string, specifier: string): string => `${challengeId}:${specifier}`

/**
 * @param {number} amount
 * @returns {number}
 */
const padUIAmount = (amount: number): number =>
  amount * 10 ** DECIMALS

/**
 * @param {number} amount
 * @returns {Uint8Array}
 */
const createAmountAsPaddedUint8Array = (amount: number): Uint8Array => {
  const padded = padUIAmount(amount)
  return (new BN(padded)).toArray('le', 8)
}

/**
 * Constructs an attestation from inputs.
 *
 * @param {boolean} isBot
 * @param {string} recipientEthAddress
 * @param {number} tokenAmount
 * @param {string} transferId
 * @param {string} oracleAddress
 * @returns {Uint8Array}
 */
const constructAttestation = (isBot: boolean, recipientEthAddress: string, tokenAmount: number, transferId: string, oracleAddress: string): Uint8Array => {
  const userBytes = ethAddressToArray(recipientEthAddress)
  const oracleBytes = ethAddressToArray(oracleAddress)
  const transferIdBytes = encoder.encode(transferId)
  const amountBytes = createAmountAsPaddedUint8Array(tokenAmount)
  const items = isBot ? [userBytes, amountBytes, transferIdBytes] : [userBytes, amountBytes, transferIdBytes, oracleBytes]
  const sep = encoder.encode('_')
  const res = items.slice(1).reduce((prev, cur, i) => {
    return Uint8Array.of(...prev, ...sep, ...cur)
  }, Uint8Array.from(items[0]))
  return res
}

/**
 * Derives the Solana account associated with a given sender Eth address.
 *
 * @param {string} ethAddress
 * @param {PublicKey} rewardManagerProgramId
 * @param {PublicKey} rewardManagerAccount
 * @returns {Promise<PublicKey>}
 */
const deriveSolanaSenderFromEthAddress = async (ethAddress: string, rewardManagerProgramId: PublicKey, rewardManagerAccount: PublicKey): Promise<PublicKey> => {
  const ethAddressArr = ethAddressToArray(ethAddress)
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  const [, derivedSender, ] = await findProgramAddressWithAuthority(
    rewardManagerProgramId,
    rewardManagerAccount,
    new Uint8Array([...encodedPrefix, ...ethAddressArr])
  )
  return derivedSender
}

/**
 * Puts an instruction in a serializable form that our relay can understand.
 *
 * @param {TransactionInstruction} instruction
 */
const prepareInstructionForRelay = (instruction: TransactionInstruction) => ({
  programId: instruction.programId.toString(),
  data: instruction.data,
  keys: instruction.keys.map(({isSigner, pubkey, isWritable}) => ({
    pubkey: pubkey.toString(),
    isSigner,
    isWritable
  }))
})


/**
 * Derives the 'transfer account' - the account which represents a single successful disbursement and is used to dedupe - from the transferId and other info>
 *
 * @param {string} transferId
 * @param {PublicKey} rewardProgramId
 * @param {PublicKey} rewardManager
 * @returns {Promise<PublicKey>}
 */
const deriveTransferAccount = async (transferId: string, rewardProgramId: PublicKey, rewardManager: PublicKey): Promise<PublicKey> => {
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_PREFIX),
    ...encoder.encode(transferId)
  ])
  const [_, derivedAddress] = await findProgramAddressWithAuthority(rewardProgramId, rewardManager, seed)
  return derivedAddress
}

/**
 * Derives the account to store messages for a single challenge
 *
 * @param {string} transferId
 * @param {PublicKey} rewardsProgramId
 * @param {PublicKey} rewardManager
 * @returns {Promise<[PublicKey, PublicKey, number]>}
 */
const deriveMessageAccount = async (transferId: string, rewardsProgramId: PublicKey, rewardManager: PublicKey): Promise<[PublicKey, PublicKey, number]> => {
  const encodedPrefix = encoder.encode(VERIFY_TRANSFER_SEED_PREFIX)
  const encodedTransferId = encoder.encode(transferId)
  const seeds = Uint8Array.from([...encodedPrefix, ...encodedTransferId])
  return findProgramAddressWithAuthority(rewardsProgramId, rewardManager, seeds)
}

/**
 * Derives a program address from a program ID and pubkey as seed.
 * Returns the new pubkey and bump seeds.
 *
 * @param {PublicKey} programId
 * @param {PublicKey} pubkey
 * @returns {Promise<[PublicKey, number]>}
 */
const findProgramAddressFromPubkey = (programId: PublicKey, pubkey: PublicKey): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress([pubkey.toBytes().slice(0, 32)], programId)
}

/**
 * Finds a 'derived' address by finding a programAddress with
 * seeds array  as first 32 bytes of base + seeds
 * Returns [derivedAddress, bumpSeed]
 *
 * @param {PublicKey} programId
 * @param {PublicKey} base
 * @param {Uint8Array} seed
 * @returns {Promise<[PublicKey, number]>}
 */
const findProgramAddressFromPubkeyAndSeeds = (programId: PublicKey, base: PublicKey, seed: Uint8Array): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddress([base.toBytes().slice(0, 32), seed], programId)
}

/**
 * Finds a program address, using both seeds, pubkey, and the derived rewards manager authority.
 * Return [rewardManagerAutuhority, derivedAddress, and bumpSeeds]
 *
 * @param {PublicKey} programId
 * @param {PublicKey} rewardManager
 * @param {Uint8Array} seed
 * @returns {Promise<[PublicKey, PublicKey, number]>}
 */
const findProgramAddressWithAuthority = async (programId: PublicKey, rewardManager: PublicKey, seed: Uint8Array): Promise<[PublicKey, PublicKey, number]> => {
  // Finds the rewardManagerAuthority account by generating
  // a PDA with the rewardsMnager as a seed
  const [rewardManagerAuthority,] = await findProgramAddressFromPubkey(programId, rewardManager)
  const [derivedAddress, bumpSeed] = await findProgramAddressFromPubkeyAndSeeds(programId, rewardManagerAuthority, seed)
  return [rewardManagerAuthority, derivedAddress, bumpSeed]
}
