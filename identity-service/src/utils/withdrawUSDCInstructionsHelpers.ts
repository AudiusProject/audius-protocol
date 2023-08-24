import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { Keypair } from '@solana/web3.js'
import { Instruction } from './relayHelpers'
import config from '../config'

const checkCreateAccountInstruction = (instruction: Instruction) => {
  const isCreateInstruction =
    instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toString()
  return isCreateInstruction
}

const checkCloseAccountInstruction = (instruction: Instruction) => {
  const feePayerKeypairs = config.get('solanaFeePayerWallets')
  const feePayerPubkeys = feePayerKeypairs.map(
    (wallet: { privateKey: Uint8Array }) =>
      Keypair.fromSecretKey(
        Uint8Array.from(wallet.privateKey)
      ).publicKey.toString()
  )
  const isCloseInstruction =
    instruction.programId === TOKEN_PROGRAM_ID.toString() &&
    instruction.data &&
    instruction.data.data &&
    instruction.data.data[0] === 9
  const isFeePayerReimbursed = feePayerPubkeys.includes(
    instruction.keys[1].pubkey
  )
  return isCloseInstruction && isFeePayerReimbursed
}

/**
 * Checks if the given instructions are a USDC withdrawal swap transaction. This is a special case
 * where a USDC associated token account is created, used for swapping USDC for SOL, and then closed.
 */
export const isUSDCWithdrawalTransaction = (instructions: Instruction[]) => {
  if (!instructions.length) return false
  const isCreateInstructionValidated = checkCreateAccountInstruction(
    instructions[0]
  )
  console.log(
    `REED isCreateInstructionValidated ${isCreateInstructionValidated}`
  )
  const isCloseInstructionValidated = checkCloseAccountInstruction(
    instructions[instructions.length - 1]
  )
  console.log(`REED isCloseInstructionValidated ${isCloseInstructionValidated}`)
  return isCloseInstructionValidated
}
