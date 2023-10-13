import { struct, u8 } from '@solana/buffer-layout'
import { u64 } from '@solana/buffer-layout-utils'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  AccountMeta,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram
} from '@solana/web3.js'

import { borshString, ethAddress } from '../layout-utils'

import {
  REWARD_MANAGER_PROGRAM_ID,
  RewardManagerInstruction
} from './constants'

type EvaluateAttestationsInstructionData = {
  instruction: RewardManagerInstruction
  amount: bigint
  transferId: string
  destinationEthAddress: string
}

const evaluateAttestationsInstructionData =
  struct<EvaluateAttestationsInstructionData>([
    u8('instruction'),
    u64('amount'),
    borshString(32, 'transferId'),
    ethAddress('ethRecipient')
  ])

export const createEvaluateAttestationsInstruction = (
  transferId: string,
  destinationEthAddress: string,
  amount: bigint,
  verifiedMessages: PublicKey,
  rewardManager: PublicKey,
  authority: PublicKey,
  rewardManagerTokenSource: PublicKey,
  destinationUserbank: PublicKey,
  transferAccount: PublicKey,
  antiAbuse: PublicKey,
  payer: PublicKey,
  tokenProgramId: PublicKey = TOKEN_PROGRAM_ID,
  rewardManagerProgramId: PublicKey = REWARD_MANAGER_PROGRAM_ID
) => {
  const maxData = Buffer.alloc(evaluateAttestationsInstructionData.span)
  const actualLength = evaluateAttestationsInstructionData.encode(
    {
      instruction: RewardManagerInstruction.EvaluateAttestations,
      transferId,
      amount,
      destinationEthAddress
    },
    maxData
  )
  const data = maxData.slice(0, actualLength)
  const keys: AccountMeta[] = [
    { pubkey: verifiedMessages, isSigner: false, isWritable: true },
    { pubkey: rewardManager, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: rewardManagerTokenSource, isSigner: false, isWritable: true },
    { pubkey: destinationUserbank, isSigner: false, isWritable: true },
    { pubkey: transferAccount, isSigner: false, isWritable: true },
    { pubkey: antiAbuse, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  ]
  return new TransactionInstruction({
    programId: rewardManagerProgramId,
    keys,
    data
  })
}

export type DecodedEvaluateAttestationsInstruction = {
  programId: PublicKey
  keys: {
    verifiedMessages: AccountMeta
    rewardManager: AccountMeta
    authority: AccountMeta
    rewardManagerTokenSource: AccountMeta
    destinationUserbank: AccountMeta
    transferAccount: AccountMeta
    antiAbuse: AccountMeta
    payer: AccountMeta
    rent: AccountMeta
    tokenProgramId: AccountMeta
    systemProgramId: AccountMeta
  }
  data: EvaluateAttestationsInstructionData
}

export const decodeEvaluateAttestationsInstruction = ({
  programId,
  keys: [
    verifiedMessages,
    rewardManager,
    authority,
    rewardManagerTokenSource,
    destinationUserbank,
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
    destinationUserbank,
    transferAccount,
    antiAbuse,
    payer,
    rent,
    tokenProgramId,
    systemProgramId
  },
  data: evaluateAttestationsInstructionData.decode(data)
})
