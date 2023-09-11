const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token')
const { Keypair } = require('@solana/web3.js')
const config = require('../config')
const { isRelayAllowedProgram, getInstructionEnum } = require('./relayUtils')

const JUPITER_AGGREGATOR_V3_PROGRAM_ID =
  'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph'

const CLOSE_ACCOUNT_INSTRUCTION = 9
const FEE_PAYER_ACCOUNT_INDEX = 1
const CREATE_TOKEN_ACCOUNT_INSTRUCTION_INDEX = 0
const CREATE_TOKEN_ACCOUNT_ASSOCIATED_TOKEN_ACCOUNT_INDEX = 1
const CREATE_TOKEN_ACCOUNT_OWNER_INDEX = 2
const USER_BANK_TRANSFER_INDEX_START = 1
const USER_BANK_TRANSFER_INDEX_END = 3
const JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_INDEX = 3
const JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_FEE_PAYER_ACCOUNT_INDEX = 0
const JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_INDEX = 1
const JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_OWNER_INDEX = 2
const JUPITER_SET_TOKEN_LEDGER_INSTRUCTION_INDEX = 4
const JUPITER_SET_TOKEN_LEDGER_TOKEN_ACCOUNT_INDEX = 1
const JUPITER_SWAP_INSTRUCTION_INDEX = 5
const JUPITER_SWAP_TEMP_HOLDING_ACCOUNT_OWNER_INDEX = 2
const JUPITER_SWAP_TEMP_HOLDING_ACCOUNT_INDEX = 4
const JUPITER_SWAP_RECIPIENT_ACCOUNT_INDEX = 6
const JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_INDEX = 6
const JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_INDEX = 0
const JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_DESTINATION_INDEX = 1
const JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_OWNER_INDEX = 2
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
 * Checks that the instructions are allowed for usdc -> sol jupiter swap.
 * @param {Instruction[]} instructions to check
 * @returns true if validation passes
 */
const checkJupiterSwapInstructions = (instructions) => {
  const createAccountInstruction =
    instructions[CREATE_TOKEN_ACCOUNT_INSTRUCTION_INDEX]
  const associatedTokenAccountOwner = createAccountInstruction.keys[CREATE_TOKEN_ACCOUNT_OWNER_INDEX]
  const associatedTokenAccount = createAccountInstruction.keys[
    CREATE_TOKEN_ACCOUNT_ASSOCIATED_TOKEN_ACCOUNT_INDEX
  ]

  // Check that the create associated token account instruction is correct
  const createAssociatedTokenAccountInstruction =
    instructions[JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_INDEX]
  if (createAssociatedTokenAccountInstruction.programId !== ASSOCIATED_TOKEN_PROGRAM_ID.toString()) {
    return false
  }
  const feePayerKey =
    createAssociatedTokenAccountInstruction.keys[
      JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_FEE_PAYER_ACCOUNT_INDEX
    ]
  const tempHoldingAccount =
    createAssociatedTokenAccountInstruction.keys[
      JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_INDEX
    ]
  const tempHoldingAccountOwner =
    createAssociatedTokenAccountInstruction.keys[
      JUPITER_CREATE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_OWNER_INDEX
    ]
  const isCorrectFeePayer =
    feePayerKey.pubkey === tempHoldingAccountOwner.pubkey
  const isCorrectAccountOwner = associatedTokenAccountOwner.pubkey === tempHoldingAccountOwner.pubkey
  if (!isCorrectFeePayer || !isCorrectAccountOwner) {
    return false
  }

  // Check that the set token ledger instruction is correct
  const setTokenLedgerInstruction =
    instructions[JUPITER_SET_TOKEN_LEDGER_INSTRUCTION_INDEX]
  if (setTokenLedgerInstruction.programId !== JUPITER_AGGREGATOR_V3_PROGRAM_ID) {
    return false
  }
  const isCorrectTokenLedgerTokenAccount =
    setTokenLedgerInstruction.keys[JUPITER_SET_TOKEN_LEDGER_TOKEN_ACCOUNT_INDEX]
      .pubkey === tempHoldingAccount.pubkey
  if (!isCorrectTokenLedgerTokenAccount) {
    return false
  }

  // Check that the swap instruction is correct
  const swapInstruction = instructions[JUPITER_SWAP_INSTRUCTION_INDEX]
  if (swapInstruction.programId !== JUPITER_AGGREGATOR_V3_PROGRAM_ID) {
    return false
  }
  const isCorrectHoldingAccountOwner =
    swapInstruction.keys[JUPITER_SWAP_TEMP_HOLDING_ACCOUNT_OWNER_INDEX]
      .pubkey === tempHoldingAccountOwner.pubkey
  const isCorrectHoldingAccount =
    swapInstruction.keys[JUPITER_SWAP_TEMP_HOLDING_ACCOUNT_INDEX].pubkey ===
    tempHoldingAccount.pubkey
  const isCorrectRecipient =
    swapInstruction.keys[JUPITER_SWAP_RECIPIENT_ACCOUNT_INDEX].pubkey === associatedTokenAccount.pubkey
  if (!isCorrectHoldingAccountOwner || !isCorrectHoldingAccount || !isCorrectRecipient) {
    return false
  }

  // Check that the close associated token account instruction is correct
  const closeAssociatedTokenAccountInstruction =
    instructions[JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_INDEX]
  if (closeAssociatedTokenAccountInstruction.programId !== TOKEN_PROGRAM_ID.toString()) {
    return false
  }
  const isCorrectClosedAccount =
    closeAssociatedTokenAccountInstruction.keys[
      JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_INDEX
    ].pubkey === tempHoldingAccount.pubkey
  const isCorrectClosedAccountDestination =
    closeAssociatedTokenAccountInstruction.keys[
      JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_DESTINATION_INDEX
    ].pubkey === tempHoldingAccountOwner.pubkey
  const isCorrectClosedAccountOwner =
    closeAssociatedTokenAccountInstruction.keys[
      JUPITER_CLOSE_ASSOCIATED_TOKEN_ACCOUNT_TEMP_HOLDING_ACCOUNT_OWNER_INDEX
    ].pubkey === tempHoldingAccountOwner.pubkey
  if (
    !isCorrectClosedAccount ||
    !isCorrectClosedAccountDestination ||
    !isCorrectClosedAccountOwner
  ) {
    return false
  }

  return true
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
  validations.push(checkJupiterSwapInstructions(instructions))
  validations.push(checkCreateAccountMatchesClose(instructions))
  validations.push(
    checkCloseAccountInstruction(instructions[instructions.length - 1])
  )

  return validations.every((validation) => validation)
}

module.exports = {
  isUSDCWithdrawalTransaction
}
