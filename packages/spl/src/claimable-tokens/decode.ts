import { TransactionInstruction } from '@solana/web3.js'

import { ClaimableTokenInstruction } from './constants'
import {
  DecodedCreateClaimableTokenAccountInstruction,
  decodeCreateClaimableTokenAccountInstruction
} from './create'
import {
  DecodedTransferClaimableTokenInstruction,
  decodeTransferClaimableTokenInstruction
} from './transfer'

type DecodedClaimableTokenInstruction =
  | DecodedCreateClaimableTokenAccountInstruction
  | DecodedTransferClaimableTokenInstruction

export const decodeClaimableTokenInstruction = (
  instruction: TransactionInstruction
): DecodedClaimableTokenInstruction => {
  switch (instruction.data[0]) {
    case ClaimableTokenInstruction.Create:
      return decodeCreateClaimableTokenAccountInstruction(instruction)
    case ClaimableTokenInstruction.Transfer:
      return decodeTransferClaimableTokenInstruction(instruction)
    default:
      throw new Error('Invalid Claimable Token Program Instruction')
  }
}

export const isCreateClaimableTokenAccountInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedCreateClaimableTokenAccountInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Create

export const isTransferClaimableTokenInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedTransferClaimableTokenInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Transfer
