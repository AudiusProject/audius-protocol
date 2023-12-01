import { TransactionInstruction } from '@solana/web3.js'

import { RewardManagerInstruction } from './constants'
import {
  DecodedCreateSenderPublicInstruction,
  decodeCreateSenderPublicInstruction
} from './createSenderPublic'
import {
  DecodedDeleteSenderPublicInstruction,
  decodeDeleteSenderPublicInstruction
} from './deleteSenderPublic'
import {
  DecodedEvaluateAttestationsInstruction,
  decodeEvaluateAttestationsInstruction
} from './evaluateAttestations'
import {
  DecodedSubmitAttestationsInstruction,
  decodeSubmitAttestationInstruction
} from './submitAttestation'

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
