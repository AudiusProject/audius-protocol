import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { AccountMeta, Connection, PublicKey, Secp256k1Program, sendAndConfirmTransaction, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js"
import { keccak_256 } from "js-sha3"
import { ecdsaSign } from "secp256k1"
const borsh = require('borsh')
const {getBankAccountAddress} = require('./userBank')
const BN = require('bn.js')

/// Sender program account seed
const SENDER_SEED_PREFIX = "S_"
const VERIFY_TRANSFER_SEED_PREFIX = "V_"
const TRANSFER_PREFIX = "T_"
const DECIMALS = 9

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

class TransferInstructionData {
  amount: number
  id: string
  eth_recipient: Uint8Array
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

const transferInstructionSchema = new Map([
  [
    TransferInstructionData,
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
const ethAddressToArr = (ethAddress: string) => {
  const strippedEthAddress = ethAddress.replace('0x', '')
  return Uint8Array.of(
    ...new BN(strippedEthAddress, 'hex').toArray('be')
  )
}

const constructTransferId = (challengeId: string, specifier: string) => `${challengeId}:${specifier}`

const createAmount = (amount: number) => {
  const padded = amount * 10 ** DECIMALS
  return (new BN(padded)).toArray('le', 8)
}

const constructAttestation = (isBot: boolean, recipientEthAddress: string, tokenAmount: number, transferId: string, oracleAddress: string) => {
  console.log("CONSTRUCTING!!!")
  const encoder = new TextEncoder()
  const userBytes = ethAddressToArr(recipientEthAddress)
  const oracleBytes = ethAddressToArr(oracleAddress)
  const transferIdBytes = encoder.encode(transferId)
  const amountBytes = createAmount(tokenAmount)
  console.log({amountBytes})
  const items = isBot ? [userBytes, amountBytes, transferIdBytes] : [userBytes, amountBytes, transferIdBytes, oracleBytes]
  const sep = encoder.encode('_')
  const res = items.slice(1).reduce((prev, cur, i) => {
    return Uint8Array.of(...prev, ...sep, ...cur)
  }, Uint8Array.from(items[0]))
  return res
}


// TODO: this should work with *multiple* votes
type AttestationMeta = {
  ethAddress: string
  attestationSignature: string
}
export async function verifyTransferSignature({
  rewardManagerProgramId,
  rewardManagerAccount,
  ethAddress,
  challengeId,
  specifier,
  feePayer,
  feePayerSecret, // Remove this :)
  attestationSignature,
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
  recipientEthAddress: string,
  tokenAmount: number, // TODO: this should be a BN I think?
  oracleAddress: string,
  isBot?: boolean
}) {
  const connection = new Connection('https://api.devnet.solana.com')
  const encoder = new TextEncoder()
  const encodedPrefix = encoder.encode(SENDER_SEED_PREFIX)

  const ethAddressArr = ethAddressToArr(ethAddress)

  const [, derivedSender, ] = await findDerivedPair(
    rewardManagerProgramId,
    rewardManagerAccount,
    new Uint8Array([...encodedPrefix, ...ethAddressArr])
  )

  const transferId = constructTransferId(challengeId, specifier)
  const [rewardManagerAuthority, derivedMessageAccount,] = await deriveMessageAccount(transferId, rewardManagerProgramId, rewardManagerAccount)

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


  const encodedSenderMessage = constructAttestation(isBot, recipientEthAddress,tokenAmount, transferId, oracleAddress)

  // Perform signature manipulations:
  // - remove the 0x prefix, and then lose the final byte
  // ('1b', which is the recovery ID, and not desired by the `createInsturctionWithEthAddress` method)
  let strippedSignature = attestationSignature.replace('0x', '')
  const recoveryIdStr = strippedSignature.slice(strippedSignature.length - 2)
  const recoveryId = new BN(recoveryIdStr, 'hex').toNumber()
  strippedSignature = strippedSignature.slice(0, strippedSignature.length - 2)
  const encodedSignature = Uint8Array.of(
    ...new BN(strippedSignature, 'hex').toArray('be') // 0 pad to add length, but this seems wrong. Idk
  )

  const secpInstruction = Secp256k1Program.createInstructionWithEthAddress({
    ethAddress,
    message: encodedSenderMessage,
    signature: encodedSignature,
    recoveryId,
  })

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
  // Sign with the fee payer
  transaction.sign({
    publicKey: feePayer,
    secretKey: feePayerSecret
  })

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

export const transfer = async ({
  rewardProgramId,
  rewardManagerAccount,
  rewardManagerTokenSource,
  challengeId,
  specifier,
  recipientEthAddress,
  userBankAccount,
  oracleEthAddress,
  feePayer,
  feePayerSecret,
  amount
}: {
  rewardProgramId: PublicKey
  rewardManagerAccount: PublicKey
  rewardManagerTokenSource: PublicKey
  challengeId: string
  specifier: string
  recipientEthAddress: string
  userBankAccount: PublicKey,
  oracleEthAddress: string
  feePayer: PublicKey
  feePayerSecret: Uint8Array
  amount: number
}) => {
  const encoder = new TextEncoder()
  const transferId = constructTransferId(challengeId, specifier)
  const [rewardManagerAuthority, verifiedMessagesAccount,] = await deriveMessageAccount(transferId, rewardProgramId, rewardManagerAccount)
  const transferAccount = await deriveTransferAccount(transferId, rewardProgramId, rewardManagerAccount)
  // G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s
  const recipientBankAccount = await getBankAccountAddress(recipientEthAddress, userBankAccount, TOKEN_PROGRAM_ID)
  const [_, derivedBotAddress ] = await findDerivedPair(
    rewardProgramId,
    rewardManagerAccount,
    Uint8Array.from([
      ...encoder.encode(SENDER_SEED_PREFIX),
      ...ethAddressToArr(oracleEthAddress)
    ])
  )
  console.log({derivedBotAddress})

  //       let derived_seed = [
  //           TRANSFER_SEED_PREFIX.as_bytes().as_ref(),
  //           transfer_data.id.as_ref(),
  //       ]
  //       .concat();
  //       let (reward_manager_authority, _, bump_seed) =
  //           find_derived_pair(program_id, reward_manager_info.key, derived_seed.as_ref());

  //       let signers_seeds = &[
  //           &reward_manager_authority.to_bytes()[..32],
  //           &derived_seed.as_slice(),
  //           &[bump_seed],
  //       ];

  //       // TODO: Verify transfer target address

  //       // Create deterministic account on-chain
  //       create_account(
  //           program_id,
  //           payer_info.clone(),
  //           transfer_account_info.clone(),
  //           0,
  //           &[signers_seeds],
  //           rent,
  //       )?;


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

  const instructionData = new TransferInstructionData({
    amount: amount * 10**DECIMALS,
    id: transferId,
    eth_recipient: ethAddressToArr(recipientEthAddress)
  })
  const serializedInstructionData = borsh.serialize(transferInstructionSchema, instructionData)
  const serializedInstructionEnum = Buffer.from(Uint8Array.of(
    5,
    ...serializedInstructionData
  ))
  const connection = new Connection('https://api.devnet.solana.com')
  const transferInstruction = new TransactionInstruction({
    keys: accounts,
    programId: rewardProgramId,
    data: serializedInstructionEnum
  })

  const { blockhash: recentBlockhash }= await connection.getRecentBlockhash()
  const transaction = new Transaction({
    feePayer,
    recentBlockhash
  })
  transaction.add(transferInstruction)
  transaction.sign({
    publicKey: feePayer,
    secretKey: feePayerSecret
  })

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

const deriveTransferAccount = async (transferId: string, rewardProgramId: PublicKey, rewardManager: PublicKey) => {
  const encoder = new TextEncoder()
  const seed = Uint8Array.from([
    ...encoder.encode(TRANSFER_PREFIX),
    ...encoder.encode(transferId)
  ])
  const [_, derivedAddress] = await findDerivedPair(rewardProgramId, rewardManager, seed)
  return derivedAddress
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
