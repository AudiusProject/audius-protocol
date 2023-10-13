import { PublicKey, AccountMeta, TransactionInstruction } from '@solana/web3.js'

import { RewardManagerInstruction } from './constants'

export type DecodedDeleteSenderPublicInstruction = {
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

export const decodeDeleteSenderPublicInstruction = ({
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
