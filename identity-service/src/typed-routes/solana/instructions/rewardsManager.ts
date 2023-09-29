import { AccountMeta, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { deserialize } from 'borsh'
import { decodeEthereumWallet } from './utils'

enum RewardsManagerInstruction {
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
  data: { instruction: RewardsManagerInstruction; transferId: string }
}

class SubmitAttestationInstructionData {
  id: string
  constructor({ transferId }: { transferId: string }) {
    this.id = transferId
  }
}

const submitAttestationInstructionSchema = new Map([
  [
    SubmitAttestationInstructionData,
    {
      kind: 'struct',
      fields: [['id', 'string']]
    }
  ]
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
  data: {
    instruction: RewardsManagerInstruction.SubmitAttestation,
    transferId: (
      deserialize(
        submitAttestationInstructionSchema,
        SubmitAttestationInstructionData,
        data.slice(1)
      ) as SubmitAttestationInstructionData
    ).id
  }
})

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
  data: {
    instruction: RewardsManagerInstruction
    amount: bigint
    id: string
    ethRecipient: string
  }
}

type EvaluateAttestationsInstructionDataConfig = {
  amount: bigint
  id: string
  ethRecipient: Uint8Array
}

class EvaluateAttestationsInstructionData {
  amount: bigint
  id: string
  eth_recipient: Uint8Array

  constructor({
    amount,
    id,
    ethRecipient
  }: EvaluateAttestationsInstructionDataConfig) {
    this.amount = amount
    this.id = id
    this.eth_recipient = ethRecipient
  }
}

const evaluateAttestationsInstructionSchema = new Map([
  [
    EvaluateAttestationsInstructionData,
    {
      kind: 'struct',
      fields: [
        ['amount', 'u64'],
        ['id', 'string'],
        ['eth_recipient', [20]]
      ]
    }
  ]
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
}: TransactionInstruction): DecodedEvaluateAttestationsInstruction => {
  const instructionData: EvaluateAttestationsInstructionData = deserialize(
    evaluateAttestationsInstructionSchema,
    EvaluateAttestationsInstructionData,
    data
  )
  return {
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
    data: {
      instruction: RewardsManagerInstruction.EvaluateAttestations,
      amount: instructionData.amount,
      id: instructionData.id,
      ethRecipient: decodeEthereumWallet(
        Buffer.from(instructionData.eth_recipient)
      )
    }
  }
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
  data: {
    instruction: RewardsManagerInstruction.CreateSenderPublic
    ethAddress: string
    operator: string
  }
}

class CreateSenderPublicInstructionData {
  eth_address: Uint8Array
  operator: Uint8Array

  constructor({
    ethAddress,
    operator
  }: {
    ethAddress: Uint8Array
    operator: Uint8Array
  }) {
    this.eth_address = ethAddress
    this.operator = operator
  }
}

const createSenderPublicInstructionSchema = new Map([
  [
    CreateSenderPublicInstructionData,
    {
      kind: 'struct',
      fields: [
        ['eth_address', [20]],
        ['operator', [20]]
      ]
    }
  ]
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
}: TransactionInstruction): DecodedCreateSenderPublicInstruction => {
  const instructionData: CreateSenderPublicInstructionData = deserialize(
    createSenderPublicInstructionSchema,
    CreateSenderPublicInstructionData,
    data.slice(1)
  )
  return {
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
    data: {
      instruction: RewardsManagerInstruction.CreateSenderPublic,
      ethAddress: decodeEthereumWallet(
        Buffer.from(instructionData.eth_address)
      ),
      operator: decodeEthereumWallet(Buffer.from(instructionData.operator))
    }
  }
}

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
    instruction: RewardsManagerInstruction.DeleteSenderPublic
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
    instruction: RewardsManagerInstruction.DeleteSenderPublic
  }
})

type DecodedRewardManagerInstruction =
  | DecodedCreateSenderPublicInstruction
  | DecodedDeleteSenderPublicInstruction
  | DecodedSubmitAttestationsInstruction
  | DecodedEvaluateAttestationsInstruction

export const decodeRewardsManagerInstruction = (
  instruction: TransactionInstruction
): DecodedRewardManagerInstruction => {
  switch (instruction.data[0]) {
    case RewardsManagerInstruction.Init:
    case RewardsManagerInstruction.ChangeManagerAccount:
    case RewardsManagerInstruction.CreateSender:
    case RewardsManagerInstruction.DeleteSender:
      throw new Error('Not Implemented')
    case RewardsManagerInstruction.CreateSenderPublic:
      return decodeCreateSenderPublicInstruction(instruction)
    case RewardsManagerInstruction.DeleteSenderPublic:
      return decodeDeleteSenderPublicInstruction(instruction)
    case RewardsManagerInstruction.SubmitAttestation:
      return decodeSubmitAttestationInstruction(instruction)
    case RewardsManagerInstruction.EvaluateAttestations:
      return decodeEvaluateAttestationsInstruction(instruction)
    default:
      throw new Error('Invalid RewardsManager Instruction')
  }
}
