import {
  AccountMeta,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import { ethAddress } from './utils'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { struct, u8 } from '@solana/buffer-layout'
import { publicKey, u64 } from '@solana/buffer-layout-utils'

enum ClaimableTokenInstruction {
  Create = 0,
  Transfer = 1
}

const CLAIMABLE_TOKEN_PROGRAM_ID = new PublicKey(
  'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'
)
type CreateClaimableTokenAccountInstructionData = {
  instruction: ClaimableTokenInstruction
  ethAddress: string
}
const createClaimableTokenAccountInstructionData =
  struct<CreateClaimableTokenAccountInstructionData>([
    u8('instruction'),
    ethAddress('ethAddress')
  ])

export const createClaimableTokenAccountInstruction = (
  ethAddress: string,
  payer: PublicKey,
  mint: PublicKey,
  authority: PublicKey,
  userbank: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
  programId: PublicKey = CLAIMABLE_TOKEN_PROGRAM_ID
) => {
  const data = Buffer.alloc(createClaimableTokenAccountInstructionData.span)
  createClaimableTokenAccountInstructionData.encode(
    { instruction: ClaimableTokenInstruction.Create, ethAddress },
    data
  )
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userbank, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  ]
  return new TransactionInstruction({ keys, programId, data })
}

type DecodedCreateClaimableTokenAccountInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    mint: AccountMeta
    authority: AccountMeta
    userbank: AccountMeta
    rent: AccountMeta
    tokenProgramId: AccountMeta
    systemProgramId: AccountMeta
  }
  data: CreateClaimableTokenAccountInstructionData
}

const decodeCreateClaimableTokenAccountInstruction = ({
  programId,
  keys: [
    payer,
    mint,
    authority,
    userbank,
    rent,
    tokenProgramId,
    systemProgramId
  ],
  data
}: TransactionInstruction): DecodedCreateClaimableTokenAccountInstruction => ({
  programId,
  keys: {
    payer,
    mint,
    authority,
    userbank,
    rent,
    tokenProgramId,
    systemProgramId
  },
  data: createClaimableTokenAccountInstructionData.decode(data)
})

type TransferClaimableTokenInstructionData = {
  instruction: ClaimableTokenInstruction
  destination: PublicKey
  amount: bigint
  nonce: bigint
}
const transferClaimableTokenInstructionData =
  struct<TransferClaimableTokenInstructionData>([
    u8('instruction'),
    publicKey('destination'),
    u64('amount'),
    u64('nonce')
  ])

export const createTransferClaimableTokenInstruction = (
  payer: PublicKey,
  sourceUserbank: PublicKey,
  destination: PublicKey,
  nonceAccount: PublicKey,
  nonce: bigint,
  authority: PublicKey,
  amount: bigint,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
  programId: PublicKey = CLAIMABLE_TOKEN_PROGRAM_ID
) => {
  const data = Buffer.alloc(transferClaimableTokenInstructionData.span)
  transferClaimableTokenInstructionData.encode(
    {
      instruction: ClaimableTokenInstruction.Transfer,
      destination,
      amount,
      nonce
    },
    data
  )
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: sourceUserbank, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: nonceAccount, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false }
  ]
  return new TransactionInstruction({ programId, keys, data })
}

type DecodedTransferClaimableTokenInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    sourceUserbank: AccountMeta
    destination: AccountMeta
    nonceAccount: AccountMeta
    authority: AccountMeta
    rent: AccountMeta
    sysvarInstructions: AccountMeta
    systemProgramId: AccountMeta
    tokenProgramId: AccountMeta
  }
  data: TransferClaimableTokenInstructionData
}

const decodeTransferClaimableTokenInstruction = ({
  programId,
  keys: [
    payer,
    sourceUserbank,
    destination,
    nonceAccount,
    authority,
    rent,
    sysvarInstructions,
    systemProgramId,
    tokenProgramId
  ],
  data
}: TransactionInstruction): DecodedTransferClaimableTokenInstruction => ({
  programId,
  keys: {
    payer,
    sourceUserbank,
    destination,
    nonceAccount,
    authority,
    rent,
    sysvarInstructions,
    systemProgramId,
    tokenProgramId
  },
  data: transferClaimableTokenInstructionData.decode(data)
})

type DecodedClaimableTokenInstruction =
  | DecodedCreateClaimableTokenAccountInstruction
  | DecodedTransferClaimableTokenInstruction

export const decodeClaimableTokenInstruction = (
  instruction: TransactionInstruction
) => {
  switch (instruction.data[0]) {
    case ClaimableTokenInstruction.Create:
      return decodeCreateClaimableTokenAccountInstruction(instruction)
    case ClaimableTokenInstruction.Transfer:
      return decodeTransferClaimableTokenInstruction(instruction)
    default:
      throw new Error('Invalid Claimable Token Program Instruction')
  }
}

export const isCreateClaimableTokenAccountInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedCreateClaimableTokenAccountInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Create

export const isTransferClaimableTokenInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedTransferClaimableTokenInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Transfer
