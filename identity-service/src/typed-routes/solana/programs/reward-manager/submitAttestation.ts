import { struct, u8, cstr } from '@solana/buffer-layout'
import { PublicKey, AccountMeta, TransactionInstruction } from '@solana/web3.js'
import { RewardManagerInstruction } from './constants'

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

type SubmitAttestationInstructionData = {
  instruction: RewardManagerInstruction
  transferId: string
}
const submitAttestationInstructionData =
  struct<SubmitAttestationInstructionData>([
    u8('instruction'),
    cstr('transferId')
  ])

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
