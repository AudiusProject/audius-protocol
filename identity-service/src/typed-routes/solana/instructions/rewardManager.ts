import { cstr, struct, u8 } from '@solana/buffer-layout'
import { u64 } from '@solana/buffer-layout-utils'
import { AccountMeta, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { ethAddress } from './utils'

enum RewardManagerInstruction {
  Init = 0,
  ChangeManagerAccount = 1,
  CreateSender = 2,
  DeleteSender = 3,
  CreateSenderPublic = 4,
  DeleteSenderPublic = 5,
  SubmitAttestation = 6,
  EvaluateAttestations = 7
}

type DecodedSubmitAttestationsInstruction = {
  programId: PublicKey
  keys: {
    verifiedMessages: AccountMeta
    rewardManager: AccountMeta
    authority: AccountMeta
    payer: AccountMeta
    sender: AccountMeta
    rent: AccountMeta
    sysvarInstructions: AccountMeta
    systemProgramId: AccountMeta
  }
  data: { instruction: RewardManagerInstruction; transferId: string }
}

type SubmitAttestationInstructionData = {
  instruction: RewardManagerInstruction
  transferId: string
}
const submitAttestationInstructionData =
  struct<SubmitAttestationInstructionData>([
    u8('instruction'),
    cstr('transferId')
  ])

const decodeSubmitAttestationInstruction = ({
  programId,
  keys: [
    verifiedMessages,
    rewardManager,
    authority,
    payer,
    sender,
    rent,
    sysvarInstructions,
    systemProgramId
  ],
  data
}: TransactionInstruction): DecodedSubmitAttestationsInstruction => ({
  programId,
  keys: {
    verifiedMessages,
    rewardManager,
    authority,
    payer,
    sender,
    rent,
    sysvarInstructions,
    systemProgramId
  },
  data: submitAttestationInstructionData.decode(data)
})

type EvaluateAttestationsInstructionData = {
  instruction: RewardManagerInstruction
  amount: bigint
  id: string
  ethRecipient: string
}

type DecodedEvaluateAttestationsInstruction = {
  programId: PublicKey
  keys: {
    verifiedMessages: AccountMeta
    rewardManager: AccountMeta
    authority: AccountMeta
    rewardManagerTokenSource: AccountMeta
    receiverUserbank: AccountMeta
    transferAccount: AccountMeta
    antiAbuse: AccountMeta
    payer: AccountMeta
    rent: AccountMeta
    tokenProgramId: AccountMeta
    systemProgramId: AccountMeta
  }
  data: EvaluateAttestationsInstructionData
}

const evaluateAttestationsInstructionData =
  struct<EvaluateAttestationsInstructionData>([
    u8('instruction'),
    u64('amount'),
    cstr('id'),
    ethAddress('ethRecipient')
  ])

const decodeEvaluateAttestationsInstruction = ({
  programId,
  keys: [
    verifiedMessages,
    rewardManager,
    authority,
    rewardManagerTokenSource,
    receiverUserbank,
    transferAccount,
    antiAbuse,
    payer,
    rent,
    tokenProgramId,
    systemProgramId
  ],
  data
}: TransactionInstruction): DecodedEvaluateAttestationsInstruction => ({
  programId,
  keys: {
    verifiedMessages,
    rewardManager,
    authority,
    rewardManagerTokenSource,
    receiverUserbank,
    transferAccount,
    antiAbuse,
    payer,
    rent,
    tokenProgramId,
    systemProgramId
  },
  data: evaluateAttestationsInstructionData.decode(data)
})

type CreateSenderPublicInstructionData = {
  instruction: RewardManagerInstruction
  ethAddress: string
  operator: string
}

type DecodedCreateSenderPublicInstruction = {
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

const decodeCreateSenderPublicInstruction = ({
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

type DecodedDeleteSenderPublicInstruction = {
  programId: PublicKey
  keys: {
    rewardManager: AccountMeta
    sender: AccountMeta
    refunder: AccountMeta
    sysvarInstructions: AccountMeta
    existingSenders: AccountMeta[]
  }
  data: {
    instruction: RewardManagerInstruction.DeleteSenderPublic
  }
}
const decodeDeleteSenderPublicInstruction = ({
  programId,
  keys: [
    rewardManager,
    sender,
    refunder,
    sysvarInstructions,
    ...existingSenders
  ]
}: TransactionInstruction): DecodedDeleteSenderPublicInstruction => ({
  programId,
  keys: {
    rewardManager,
    sender,
    refunder,
    sysvarInstructions,
    existingSenders
  },
  data: {
    instruction: RewardManagerInstruction.DeleteSenderPublic
  }
})

type DecodedRewardManagerInstruction =
  | DecodedCreateSenderPublicInstruction
  | DecodedDeleteSenderPublicInstruction
  | DecodedSubmitAttestationsInstruction
  | DecodedEvaluateAttestationsInstruction

export const decodeRewardManagerInstruction = (
  instruction: TransactionInstruction
): DecodedRewardManagerInstruction => {
  switch (instruction.data[0]) {
    case RewardManagerInstruction.Init:
    case RewardManagerInstruction.ChangeManagerAccount:
    case RewardManagerInstruction.CreateSender:
    case RewardManagerInstruction.DeleteSender:
      throw new Error('Not Implemented')
    case RewardManagerInstruction.CreateSenderPublic:
      return decodeCreateSenderPublicInstruction(instruction)
    case RewardManagerInstruction.DeleteSenderPublic:
      return decodeDeleteSenderPublicInstruction(instruction)
    case RewardManagerInstruction.SubmitAttestation:
      return decodeSubmitAttestationInstruction(instruction)
    case RewardManagerInstruction.EvaluateAttestations:
      return decodeEvaluateAttestationsInstruction(instruction)
    default:
      throw new Error('Invalid RewardManager Instruction')
  }
}
