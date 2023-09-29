const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT
} = require('@solana/spl-token')
const config = require('../config')
const { getInstructionEnum, usdcMintAddress } = require('./relayUtils')

const JUPITER_AGGREGATOR_V6_PROGRAM_ID =
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'

const CLOSE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_ENUM = 9
const CREATE_ASSOCIATED_TOKEN_ACCOUNT_IDEMPOTENT_INSTRUCTION_ENUM = 1

/**
 * @typedef {import('routes/solana').RelayInstruction} RelayInstruction
 */

const allowedMints = [NATIVE_MINT.toBase58(), usdcMintAddress]

const WithdrawInstructionIndex = {
  CREATE_TOKEN_ATA: 0,
  SECP: 1,
  USERBANK_TRANSFER: 2,
  CREATE_WSOL_ATA: 3,
  SWAP: 4,
  CLOSE_WSOL_ATA: 5,
  CREATE_WSOL_ATA_2: 6,
  CLOSE_WSOL_ATA_2: 7,
  CLOSE_TOKEN_ATA: 8
}

const JupiterSwapAccountIndex = {
  USER_ACCOUNT: 2,
  USER_TOKEN_ACCOUNT: 3,
  TEMP_RECIPIENT_TOKEN_ACCOUNT: 4,
  TEMP_SENDER_TOKEN_ACCOUNT: 5,
  DESTINATION_TOKEN_ACCOUNT: 6,
  USER_TOKEN_MINT: 7,
  DESTINATION_TOKEN_MINT: 8
}

const CreateTokenAccountIndex = {
  PAYER: 0,
  TOKEN_ACCOUNT: 1,
  OWNER: 2,
  MINT: 3
}

const CloseAccountIndex = {
  TOKEN_ACCOUNT: 0,
  DESTINATION: 1,
  OWNER: 2
}

/**
 * Checks that the instruction is a createAssociatedTokenAccount instruction.
 * @param {RelayInstruction} instruction Instruction to check.
 * @returns true if the instruction is a createAssociatedTokenAccount instruction
 */
const isCreateAssociatedTokenAccountInstruction = (instruction) =>
  instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toBase58() &&
  (getInstructionEnum(instruction) === null ||
    getInstructionEnum(instruction) ===
      CREATE_ASSOCIATED_TOKEN_ACCOUNT_IDEMPOTENT_INSTRUCTION_ENUM)

/**
 * Checks that the instruction is a closeAssociatedTokenAccount instruction.
 * @param {RelayInstruction} instruction Instruction to check.
 * @returns true if the instruction is a closeAssociatedTokenAccount instruction
 */
const isCloseAssociatedTokenAccountInstruction = (instruction) =>
  instruction.programId === TOKEN_PROGRAM_ID.toBase58() &&
  getInstructionEnum(instruction) ===
    CLOSE_ASSOCIATED_TOKEN_ACCOUNT_INSTRUCTION_ENUM

/**
 * Checks that the instruction is a Jupiter program instruction
 * @param {RelayInstruction} instruction Instruction to check.
 * @returnstrue if the instruction is for the Jupiter program
 */
const isJupiterInstruction = (instruction) =>
  instruction.programId === JUPITER_AGGREGATOR_V6_PROGRAM_ID

/**
 * Checks that the token account creation is for a valid mint
 * @param {RelayInstruction} instruction Instruction to check.
 * @returns true if the mint is for wSOL or USDC
 */
const checkCreateTokenAccountMint = (instruction) =>
  allowedMints.includes(instruction.keys[CreateTokenAccountIndex.MINT].pubkey)

/**
 * Finds a matching closeAssociatedTokenAccount instruction for the given createAssociatedTokenAccount instruction
 * @param {number} createInstructionIndex the index of the createTokenAccountInstruction in instructions
 * @param {RelayInstruction[]} instructions the list of instructions in the transaction
 * @returns the index of the matching closeTokenAccountInstruction
 */
const findMatchingCloseTokenAccountInstruction = (
  createInstructionIndex,
  instructions
) => {
  const createInstruction = instructions[createInstructionIndex]
  return instructions.findIndex(
    (instr) =>
      isCloseAssociatedTokenAccountInstruction(instr) &&
      instr.keys[CloseAccountIndex.TOKEN_ACCOUNT].pubkey ===
        createInstruction.keys[CreateTokenAccountIndex.TOKEN_ACCOUNT].pubkey &&
      instr.keys[CloseAccountIndex.DESTINATION].pubkey ===
        createInstruction.keys[CreateTokenAccountIndex.PAYER].pubkey
  )
}

/**
 * Checks if the Jupiter swap is relayable. Only relay swaps of
 * @param {number} swapInstructionIndex
 * @param {RelayInstruction[]} instructions
 * @returns whether the Jupiter instruction is valid
 */
const checkJupiterSwapInstruction = (swapInstructionIndex, instructions) => {
  const sendMint = usdcMintAddress
  const destMint = NATIVE_MINT.toBase58()
  const instr = instructions[swapInstructionIndex]
  const validSourceMint =
    instr.keys[JupiterSwapAccountIndex.USER_TOKEN_MINT].pubkey === sendMint
  const validDestinationMint =
    instr.keys[JupiterSwapAccountIndex.DESTINATION_TOKEN_MINT].pubkey ===
    destMint

  return validSourceMint && validDestinationMint
}

module.exports = {
  isJupiterInstruction,
  checkJupiterSwapInstruction,
  findMatchingCloseTokenAccountInstruction,
  isCreateAssociatedTokenAccountInstruction,
  checkCreateTokenAccountMint
}
