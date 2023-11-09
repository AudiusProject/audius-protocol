import { struct, u8 } from '@solana/buffer-layout'
import { publicKey, u64 } from '@solana/buffer-layout-utils'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  TransactionInstruction,
  AccountMeta
} from '@solana/web3.js'

import {
  ClaimableTokenInstruction,
  CLAIMABLE_TOKEN_PROGRAM_ID
} from './constants'

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

export type DecodedTransferClaimableTokenInstruction = {
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

export const decodeTransferClaimableTokenInstruction = ({
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
