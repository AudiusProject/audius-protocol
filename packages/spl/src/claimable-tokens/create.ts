import { struct, u8 } from '@solana/buffer-layout'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction,
  AccountMeta
} from '@solana/web3.js'

import { ethAddress } from '../layout-utils'

import {
  CLAIMABLE_TOKEN_PROGRAM_ID,
  ClaimableTokenInstruction
} from './constants'

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

export type DecodedCreateClaimableTokenAccountInstruction = {
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

export const decodeCreateClaimableTokenAccountInstruction = ({
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
