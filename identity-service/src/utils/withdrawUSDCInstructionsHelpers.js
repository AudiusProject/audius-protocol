const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token')
const { Keypair } = require('@solana/web3.js')
const config = require('../config')
const { isRelayAllowedProgram, getInstructionEnum } = require('./relayUtils')

const CLOSE_ACCOUNT_INSTRUCTION = 9
const FEE_PAYER_ACCOUNT_INDEX = 1
const CREATE_TOKEN_ACCOUNT_INSTRUCTION_INDEX = 0
const USER_BANK_TRANSFER_INDEX_START = 1
const USER_BANK_TRANSFER_INDEX_END = 3
const ACCOUNT_TO_CREATE_INDEX = 1
const ACCOUNT_TO_CLOSE_INDEX = 0

/**
 * Checks that the instruction is a create account instruction for an associated token account.
 * @param {Instruction} instruction to check
 * @returns true if validation passes
 */
const checkCreateAccountInstruction = (instruction) => {
  return (
    instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toString() &&
    getInstructionEnum(instruction) === null
  )
}

/**
 * @param {Instruction} instruction to check
 * @returns true if validation passes
 */
const checkCloseAccountInstruction = (instruction) => {
  const feePayerKeypairs = config.get('solanaFeePayerWallets')
  const feePayerPubkeys = feePayerKeypairs.map((wallet) =>
    Keypair.fromSecretKey(
      Uint8Array.from(wallet.privateKey)
    ).publicKey.toString()
  )
  const isCloseInstruction =
    instruction.programId === TOKEN_PROGRAM_ID.toString() &&
    getInstructionEnum(instruction) === CLOSE_ACCOUNT_INSTRUCTION
  const isFeePayerReimbursed = feePayerPubkeys.includes(
    instruction.keys[FEE_PAYER_ACCOUNT_INDEX].pubkey
  )
  return isCloseInstruction && isFeePayerReimbursed
}

/**
 * Checks that the account to create in the create account instruction matches the account to close
 * in the close instruction.
 * @param {Instruction[]} instructions to check
 * @returns true if validation passes
 */
const checkCreateAccountMatchesClose = (instructions) => {
  const createAccountInstruction =
    instructions[CREATE_TOKEN_ACCOUNT_INSTRUCTION_INDEX]
  const closeAccountInstruction = instructions[instructions.length - 1]
  return (
    createAccountInstruction.keys[ACCOUNT_TO_CREATE_INDEX].pubkey ===
    closeAccountInstruction.keys[ACCOUNT_TO_CLOSE_INDEX].pubkey
  )
}

/**
 * Checks if the given instructions are a USDC withdrawal swap transaction. This is a special case
 * where a USDC associated token account is created, used for swapping USDC for SOL, and then closed.
 * @param {Instruction[]} instructions to check
 * @returns true if validation passes
 */
const isUSDCWithdrawalTransaction = (instructions) => {
  if (!instructions.length) return false
  const validations = []
  validations.push(
    checkCreateAccountInstruction(
      instructions[CREATE_TOKEN_ACCOUNT_INSTRUCTION_INDEX]
    )
  )
  const transferInstructions = instructions.slice(
    USER_BANK_TRANSFER_INDEX_START,
    USER_BANK_TRANSFER_INDEX_END
  )
  validations.push(isRelayAllowedProgram(transferInstructions))
  validations.push(checkCreateAccountMatchesClose(instructions))
  validations.push(
    checkCloseAccountInstruction(instructions[instructions.length - 1])
  )

  console.log('REED validations:', validations)
  return validations.every((validation) => validation)
}

module.exports = {
  isUSDCWithdrawalTransaction
}
