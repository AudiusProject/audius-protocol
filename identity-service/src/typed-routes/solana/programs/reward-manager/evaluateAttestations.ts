import { struct, u8, cstr } from '@solana/buffer-layout'
import { u64 } from '@solana/buffer-layout-utils'
import { PublicKey, AccountMeta, TransactionInstruction } from '@solana/web3.js'
import { ethAddress } from '../../layout-utils'
import { RewardManagerInstruction } from './constants'

type EvaluateAttestationsInstructionData = {
  instruction: RewardManagerInstruction
  amount: bigint
  id: string
  ethRecipient: string
}

export type DecodedEvaluateAttestationsInstruction = {
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

export const decodeEvaluateAttestationsInstruction = ({
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
