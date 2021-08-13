import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import {
  Connection,
  PublicKey,
  Secp256k1Program,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js"
const borsh = require("borsh")
const { getBankAccountAddress } = require("./userBank")
const BN = require("bn.js")

// Various prefixes used for rewards
const SENDER_SEED_PREFIX = "S_"
const VERIFY_TRANSFER_SEED_PREFIX = "V_"
const TRANSFER_PREFIX = "T_"

// Enum cases for instructions
const SUBMIT_INSTRUCTION_ENUM_VALUE = 6
const EVALUATE_INSTRUCTION_ENUM_VALUE = 7

const encoder = new TextEncoder()

class SubmitAttestationInstructionData {
  /**
   * Creates an instance of SubmitAttestationInstructionData.
   * @param {{transferId: string}} {
   *     transferId
   *   }
   * @memberof SubmitAttestationInstructionData
   */
  constructor({ transferId }) {
    this.id = transferId
  }
}

const submitAttestationInstructionSchema = new Map([
  [
    SubmitAttestationInstructionData,
    {
      kind: "struct",
      fields: [["id", "string"]],
    },
  ],
])

class ValidateAttestationsInstructionData {
  /**
   * Creates an instance of ValidateAttestationsInstructionData.
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
  constructor({ amount, id, eth_recipient }) {
    this.amount = amount
    this.id = id
    this.eth_recipient = eth_recipient
  }
}

const validateAttestationsInstructionSchema = new Map([
  [
    ValidateAttestationsInstructionData,
    {
      kind: "struct",
      fields: [
        ["amount", "u64"],
        ["id", "string"],
        ["eth_recipient", [20]],
      ],
    },
  ],
])

/**
 * @typedef {Object} AttestationMeta
 * @property {string} ethAddress
 * @property {string} signature
 */

/**
 * Submits attestations from Discovery Nodes and AAO that a user has completed a challenge.
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
 *   tokenAmount: BN
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
  connection,
}) {
  // Construct combined transfer ID
  const transferId = constructTransferId(challengeId, specifier)

  // Derive the message account we'll use to store the attestations
  const [
    rewardManagerAuthority,
    derivedMessageAccount,
  ] = await deriveMessageAccount(
    transferId,
    rewardManagerProgramId,
    rewardManagerAccount
  )

  // Add instructions from DN attestations - each attestation
  // needs a pairing of SECP recovery instruction and submit
  // attestation instruction.
  let instructions = await Promise.all(
    attestations.reduce((instructions, meta, i) => {
      const verifyInstruction = generateSubmitAttestationInstruction({
        attestationMeta: meta,
        derivedMessageAccount,
        rewardManagerAccount,
        rewardManagerProgramId,
        rewardManagerAuthority,
        transferId,
        feePayer,
      })
      const secpInstruction = Promise.resolve(
        generateSecpInstruction({
          attestationMeta: meta,
          isOracle: false,
          recipientEthAddress,
          oracleAddress: oracleAttestation.ethAddress,
          tokenAmount,
          transferId,
          instructionIndex: 2 * i,
        })
      )
      return [...instructions, secpInstruction, verifyInstruction]
    }, [])
  )

  // Add instructions from oracle attestation
  const oracleSecp = await generateSecpInstruction({
    attestationMeta: oracleAttestation,
    recipientEthAddress,
    instructionIndex: instructions.length,
    transferId,
    isOracle: true,
    tokenAmount,
    oracleAddress: oracleAttestation.ethAddress,
  })
  const oracleTransfer = await generateSubmitAttestationInstruction({
    attestationMeta: oracleAttestation,
    derivedMessageAccount,
    rewardManagerAccount,
    rewardManagerProgramId,
    rewardManagerAuthority,
    transferId,
    feePayer,
  })
  instructions = [...instructions, oracleSecp, oracleTransfer]

  // Prep transaction to be relayed and send it
  const relayable = instructions.map(prepareInstructionForRelay)
  const { blockhash: recentBlockhash } = await connection.getRecentBlockhash()
  const transactionData = {
    recentBlockhash,
    instructions: relayable,
  }

  try {
    const response = await identityService.solanaRelay(transactionData)
    return response
  } catch (e) {
    console.error(e.message)
  }
}

/**
 * Evaluates previously submitted attestations, disbursing if successful.
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
 *   tokenAmount: BN
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
  connection,
}) => {
  // Get transfer ID
  const transferId = constructTransferId(challengeId, specifier)

  // Derive the messages account we previously stored attestations in
  const [
    rewardManagerAuthority,
    verifiedMessagesAccount,
  ] = await deriveMessageAccount(
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
      isWritable: true,
    },
    {
      pubkey: rewardManagerAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: rewardManagerAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: rewardManagerTokenSource,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: recipientBankAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: transferAccount,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: derivedAAOAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: feePayer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ]

  // Construct the instruction data
  const instructionData = new ValidateAttestationsInstructionData({
    amount: tokenAmount.toNumber(),
    id: transferId,
    eth_recipient: ethAddressToArray(recipientEthAddress),
  })
  const serializedInstructionData = borsh.serialize(
    validateAttestationsInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(EVALUATE_INSTRUCTION_ENUM_VALUE, ...serializedInstructionData)
  )
  const transferInstruction = new TransactionInstruction({
    keys: accounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum,
  })

  // Prepare and send transaction
  const relayable = prepareInstructionForRelay(transferInstruction)
  const { blockhash: recentBlockhash } = await connection.getRecentBlockhash()
  const transactionData = {
    recentBlockhash,
    instructions: relayable,
  }

  try {
    const response = await identityService.solanaRelay(transactionData)
    return response
  } catch (e) {
    console.error(e.message)
    console.log({ e })
  }
}

// Helpers

// Generate particular instructions

/**
 *
 * Helper function to generate a submit attestation instruction.
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
const generateSubmitAttestationInstruction = async ({
  attestationMeta,
  derivedMessageAccount,
  rewardManagerAccount,
  rewardManagerAuthority,
  rewardManagerProgramId,
  feePayer,
  transferId,
}) => {
  // Get the DN's derived Solana address from the eth pubkey
  const derivedSender = await deriveSolanaSenderFromEthAddress(
    attestationMeta.ethAddress,
    rewardManagerProgramId,
    rewardManagerAccount
  )

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
      isWritable: true,
    },
    {
      pubkey: rewardManagerAccount,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: rewardManagerAuthority,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: feePayer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: derivedSender,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ]

  const instructionData = new SubmitAttestationInstructionData({ transferId })
  const serializedInstructionData = borsh.serialize(
    submitAttestationInstructionSchema,
    instructionData
  )
  const serializedInstructionEnum = Buffer.from(
    Uint8Array.of(SUBMIT_INSTRUCTION_ENUM_VALUE, ...serializedInstructionData)
  )

  return new TransactionInstruction({
    keys: verifyInstructionAccounts,
    programId: rewardManagerProgramId,
    data: serializedInstructionEnum,
  })
}

/**
 *
 * @param {{
 *   attestationMeta: AttestationMeta
 *   isOracle: boolean
 *   recipientEthAddress: string
 *   tokenAmount: BN
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
  instructionIndex,
}) => {
  // Perform signature manipulations:
  // - remove the 0x prefix
  // - lose the final byte / recovery ID
  let strippedSignature = attestationMeta.signature.replace("0x", "")
  const recoveryIdStr = strippedSignature.slice(strippedSignature.length - 2)
  const recoveryId = new BN(recoveryIdStr, "hex").toNumber()
  strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2)
  const encodedSignature = Uint8Array.of(
    ...new BN(strippedSignature, "hex").toArray("be")
  )

  const encodedSenderMessage = constructAttestation(
    isOracle,
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAddress
  )

  return Secp256k1Program.createInstructionWithEthAddress({
    ethAddress: attestationMeta.ethAddress,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
    instructionIndex,
  })
}

// Misc

/**
 * Converts an eth address hex represenatation to an array of Uint8s in big endian notation
 * @param {string} ethAddress
 * @returns {Uint8Array}
 */
const ethAddressToArray = (ethAddress) => {
  const strippedEthAddress = ethAddress.replace("0x", "")
  return Uint8Array.of(...new BN(strippedEthAddress, "hex").toArray("be"))
}

/**
 * Constructs a transfer ID
 * @param {string} challengeId
 * @param {string} specifier
 * @returns {string}
 */
const constructTransferId = (challengeId, specifier) =>
  `${challengeId}:${specifier}`

/**
 * Converts a BN to a Uint8Array of length 8, in little endian notation.
 * Useful for when Rust wants a u64 (8 * 8) represented as a byte array.
 *
 * @param {BN} bn
 */
const padBNToUint8Array = (bn) => bn.toArray("le", 8)

/**
 * Constructs an attestation from inputs.
 *
 * @param {boolean} isBot
 * @param {string} recipientEthAddress
 * @param {BN} tokenAmount
 * @param {string} transferId
 * @param {string} oracleAddress
 * @returns {Uint8Array}
 */
const constructAttestation = (
  isBot,
  recipientEthAddress,
  tokenAmount,
  transferId,
  oracleAddress
) => {
  const userBytes = ethAddressToArray(recipientEthAddress)
  const oracleBytes = ethAddressToArray(oracleAddress)
  const transferIdBytes = encoder.encode(transferId)
  const amountBytes = padBNToUint8Array(tokenAmount)
  const items = isBot
    ? [userBytes, amountBytes, transferIdBytes]
    : [userBytes, amountBytes, transferIdBytes, oracleBytes]
  const sep = encoder.encode("_")
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
const deriveSolanaSenderFromEthAddress = async (
  ethAddress,
  rewardManagerProgramId,
  rewardManagerAccount
) => {
  const ethAddressArr = ethAddressToArray(ethAddress)
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  const [, derivedSender] = await findProgramAddressWithAuthority(
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
const prepareInstructionForRelay = (instruction) => ({
  programId: instruction.programId.toString(),
  data: instruction.data,
  keys: instruction.keys.map(({ isSigner, pubkey, isWritable }) => ({
    pubkey: pubkey.toString(),
    isSigner,
    isWritable,
  })),
})

/**
 * Derives the 'transfer account' - the account which represents a single successful disbursement
 * and is used to dedupe - from the transferId and other info
 *
 * @param {string} transferId
 * @param {PublicKey} rewardProgramId
 * @param {PublicKey} rewardManager
 * @returns {Promise<PublicKey>}
 */
const deriveTransferAccount = async (
  transferId,
  rewardProgramId,
  rewardManager
) => {
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_PREFIX),
    ...encoder.encode(transferId),
  ])
  const [_, derivedAddress] = await findProgramAddressWithAuthority(
    rewardProgramId,
    rewardManager,
    seed
  )
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
const deriveMessageAccount = async (
  transferId,
  rewardsProgramId,
  rewardManager
) => {
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
const findProgramAddressFromPubkey = (programId, pubkey) => {
  return PublicKey.findProgramAddress(
    [pubkey.toBytes().slice(0, 32)],
    programId
  )
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
const findProgramAddressFromPubkeyAndSeeds = (programId, base, seed) => {
  return PublicKey.findProgramAddress(
    [base.toBytes().slice(0, 32), seed],
    programId
  )
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
const findProgramAddressWithAuthority = async (
  programId,
  rewardManager,
  seed
) => {
  // Finds the rewardManagerAuthority account by generating
  // a PDA with the rewardsMnager as a seed
  const [rewardManagerAuthority] = await findProgramAddressFromPubkey(
    programId,
    rewardManager
  )
  const [derivedAddress, bumpSeed] = await findProgramAddressFromPubkeyAndSeeds(
    programId,
    rewardManagerAuthority,
    seed
  )
  return [rewardManagerAuthority, derivedAddress, bumpSeed]
}
