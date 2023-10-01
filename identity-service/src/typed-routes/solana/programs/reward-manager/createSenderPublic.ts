import { struct, u8, cstr } from '@solana/buffer-layout'
import { PublicKey, AccountMeta, TransactionInstruction } from '@solana/web3.js'
import { ethAddress } from '../../layout-utils'
import { RewardManagerInstruction } from './constants'

type CreateSenderPublicInstructionData = {
  instruction: RewardManagerInstruction
  ethAddress: string
  operator: string
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

const CreateSenderPublicInstructionData =
  struct<CreateSenderPublicInstructionData>([
    u8('instruction'),
    ethAddress('ethAddress'),
    cstr('operator')
  ])

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
  data: CreateSenderPublicInstructionData.decode(data)
})
