import { LayoutObject, struct, u8, utf8 } from '@solana/buffer-layout'
import {
  PublicKey,
  AccountMeta,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram
} from '@solana/web3.js'
import {
  REWARD_MANAGER_PROGRAM_ID,
  RewardManagerInstruction
} from './constants'
import { borshString } from '../../../../typed-routes/solana/layout-utils'

type SubmitAttestationInstructionData = {
  instruction: RewardManagerInstruction
  transferId: string
}
const submitAttestationInstructionData =
  struct<SubmitAttestationInstructionData>([
    u8('instruction'),
    borshString(32, 'transferId')
  ])

export const createSubmitAttestationInstruction = (
  transferId: string,
  verifiedMessages: PublicKey,
  rewardManager: PublicKey,
  authority: PublicKey,
  payer: PublicKey,
  sender: PublicKey,
  rewardManagerProgramId: PublicKey = REWARD_MANAGER_PROGRAM_ID
) => {
  const largerData = Buffer.alloc(submitAttestationInstructionData.span)
  const actualLength = submitAttestationInstructionData.encode(
    { instruction: RewardManagerInstruction.SubmitAttestation, transferId },
    largerData
  )
  const data = largerData.slice(0, actualLength)
  const keys: AccountMeta[] = [
    { pubkey: verifiedMessages, isSigner: false, isWritable: true },
    { pubkey: rewardManager, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: sender, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
  ]
  return new TransactionInstruction({
    programId: rewardManagerProgramId,
    keys,
    data
  })
}

export type DecodedSubmitAttestationsInstruction = {
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

export const decodeSubmitAttestationInstruction = ({
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
