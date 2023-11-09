import { struct, u8 } from '@solana/buffer-layout'
import {
  PublicKey,
  AccountMeta,
  TransactionInstruction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram
} from '@solana/web3.js'

import { ethAddress } from '../layout-utils'

import {
  REWARD_MANAGER_PROGRAM_ID,
  RewardManagerInstruction
} from './constants'

type CreateSenderPublicInstructionData = {
  instruction: RewardManagerInstruction
  senderEthAddress: string
  operatorEthAddress: string
}

const createSenderPublicInstructionData =
  struct<CreateSenderPublicInstructionData>([
    u8('instruction'),
    ethAddress('senderEthAddress'),
    ethAddress('operatorEthAddress')
  ])

export const createSenderPublicInstruction = (
  senderEthAddress: string,
  operatorEthAddress: string,
  rewardManager: PublicKey,
  authority: PublicKey,
  payer: PublicKey,
  sender: PublicKey,
  existingSenders: PublicKey[],
  rewardManagerProgramId: PublicKey = REWARD_MANAGER_PROGRAM_ID
) => {
  const data = Buffer.alloc(createSenderPublicInstructionData.span)
  createSenderPublicInstructionData.encode(
    {
      instruction: RewardManagerInstruction.CreateSenderPublic,
      senderEthAddress,
      operatorEthAddress
    },
    data
  )
  const keys = [
    { pubkey: rewardManager, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: sender, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ...existingSenders.map((pubkey) => ({
      pubkey,
      isSigner: false,
      isWritable: false
    }))
  ]
  return new TransactionInstruction({
    programId: rewardManagerProgramId,
    keys,
    data
  })
}

export type DecodedCreateSenderPublicInstruction = {
  programId: PublicKey
  keys: {
    rewardManager: AccountMeta
    authority: AccountMeta
    payer: AccountMeta
    sender: AccountMeta
    sysvarInstructions: AccountMeta
    rent: AccountMeta
    systemProgramId: AccountMeta
    existingSenders: AccountMeta[]
  }
  data: CreateSenderPublicInstructionData
}

export const decodeCreateSenderPublicInstruction = ({
  programId,
  keys: [
    rewardManager,
    authority,
    payer,
    sender,
    sysvarInstructions,
    rent,
    systemProgramId,
    ...existingSenders
  ],
  data
}: TransactionInstruction): DecodedCreateSenderPublicInstruction => ({
  programId,
  keys: {
    rewardManager,
    authority,
    payer,
    sender,
    sysvarInstructions,
    rent,
    systemProgramId,
    existingSenders
  },
  data: createSenderPublicInstructionData.decode(data)
})
