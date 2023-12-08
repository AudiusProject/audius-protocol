import { struct, u8 } from '@solana/buffer-layout'
import {
  AccountMeta,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'

import { ethAddress } from '../layout-utils'

import {
  REWARD_MANAGER_PROGRAM_ID,
  RewardManagerInstruction
} from './constants'

type CreateSenderInstructionData = {
  instruction: RewardManagerInstruction
  senderEthAddress: string
  operatorEthAddress: string
}

const createSenderInstructionData = struct<CreateSenderInstructionData>([
  u8('instruction'),
  ethAddress('senderEthAddress'),
  ethAddress('operatorEthAddress')
])

export const createSenderInstruction = (
  senderEthAddress: string,
  operatorEthAddress: string,
  rewardManager: PublicKey,
  owner: PublicKey,
  authority: PublicKey,
  payer: PublicKey,
  sender: PublicKey,
  rewardManagerProgramId: PublicKey = REWARD_MANAGER_PROGRAM_ID
) => {
  const data = Buffer.alloc(createSenderInstructionData.span)
  createSenderInstructionData.encode(
    {
      instruction: RewardManagerInstruction.CreateSender,
      senderEthAddress,
      operatorEthAddress
    },
    data
  )
  const keys: AccountMeta[] = [
    { pubkey: rewardManager, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: false },
    { pubkey: sender, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
  ]
  return new TransactionInstruction({
    programId: rewardManagerProgramId,
    keys,
    data
  })
}

export type DecodedCreateSenderInstruction = {
  programId: PublicKey
  keys: {
    rewardManager: AccountMeta
    owner: AccountMeta
    authority: AccountMeta
    payer: AccountMeta
    sender: AccountMeta
    systemProgramId: AccountMeta
    rent: AccountMeta
  }
  data: CreateSenderInstructionData
}

export const decodeCreateSenderInstruction = ({
  programId,
  keys: [rewardManager, owner, authority, payer, sender, systemProgramId, rent],
  data
}: TransactionInstruction): DecodedCreateSenderInstruction => ({
  programId,
  keys: {
    rewardManager,
    owner,
    authority,
    payer,
    sender,
    systemProgramId,
    rent
  },
  data: createSenderInstructionData.decode(data)
})
