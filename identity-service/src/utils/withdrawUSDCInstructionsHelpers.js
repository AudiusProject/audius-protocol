const {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TokenInstruction
} = require('@solana/spl-token')
const { getInstructionEnum, usdcMintAddress } = require('./relayUtils')

const JUPITER_AGGREGATOR_V6_PROGRAM_ID =
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'

/**
 * @typedef {import('routes/solana').RelayInstruction} RelayInstruction
 */

/**
 * Indexes of various accounts in a Jupiter swap instruction.
 * Educated guesses only, based on experience.
 * Only the mints are used currently.
 */
const JupiterSwapAccountIndex = {
  USER_ACCOUNT: 2,
  USER_TOKEN_ACCOUNT: 3,
  TEMP_RECIPIENT_TOKEN_ACCOUNT: 4,
  TEMP_SENDER_TOKEN_ACCOUNT: 5,
  DESTINATION_TOKEN_ACCOUNT: 6,
  USER_TOKEN_MINT: 7,
  DESTINATION_TOKEN_MINT: 8
}

/**
 * Indexes of various accounts in a createAssociatedTokenAccount instruction.
 */
const CreateTokenAccountIndex = {
  PAYER: 0,
  TOKEN_ACCOUNT: 1,
  OWNER: 2,
  MINT: 3
}

/**
 * Indexes of accounts in a closeAssociatedTokenAccount instruction
 */
const CloseAccountIndex = {
  TOKEN_ACCOUNT: 0,
  DESTINATION: 1,
  OWNER: 2
}

/**
 * Checks that the instruction is a createAssociatedTokenAccount or createAssociatedTokenAccountIdempotent instruction.
 * Note that null data is also createAssociatedTokenAccount instruction.
 * @see https://github.com/solana-labs/solana-program-library/blob/a08ec509/token/js/src/instructions/associatedTokenAccount.ts#L30C9-L30C24
 * @param {RelayInstruction} instruction Instruction to check.
 * @returns true if the instruction is a createAssociatedTokenAccount instruction
 */
const isCreateAssociatedTokenAccountInstruction = (instruction) =>
  instruction.programId === ASSOCIATED_TOKEN_PROGRAM_ID.toBase58() &&
  (getInstructionEnum(instruction) === null ||
    getInstructionEnum(instruction) === TokenInstruction.InitializeAccount)

/**
 * Checks that the instruction is a closeAssociatedTokenAccount instruction.
 * @param {RelayInstruction} instruction Instruction to check.
 * @returns true if the instruction is a closeAssociatedTokenAccount instruction
 */
const isCloseAssociatedTokenAccountInstruction = (instruction) =>
  instruction.programId === TOKEN_PROGRAM_ID.toBase58() &&
  getInstructionEnum(instruction) === TokenInstruction.CloseAccount

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
const allowedMints = [NATIVE_MINT.toBase58(), usdcMintAddress]
const checkCreateTokenAccountMint = (instruction) =>
  allowedMints.includes(instruction.keys[CreateTokenAccountIndex.MINT].pubkey)

/**
 * Finds a matching closeAssociatedTokenAccount instruction for the given createAssociatedTokenAccount instruction
 * This check prevents feePayer drain through rent reclaiming by ensuring that all rents are returned in the same transaction
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
 * Checks if the Jupiter swap is relayable. Only relay swaps of USDC to SOL
 * @param {number} swapInstructionIndex
 * @param {RelayInstruction[]} instructions
 * @returns whether the Jupiter instruction is valid
 */
const checkJupiterSwapInstruction = (swapInstructionIndex, instructions) => {
  const instr = instructions[swapInstructionIndex]
  const validSourceMint =
    instr.keys[JupiterSwapAccountIndex.USER_TOKEN_MINT].pubkey ===
    usdcMintAddress
  const validDestinationMint =
    instr.keys[JupiterSwapAccountIndex.DESTINATION_TOKEN_MINT].pubkey ===
    NATIVE_MINT.toBase58()

  return validSourceMint && validDestinationMint
}

module.exports = {
  isJupiterInstruction,
  checkJupiterSwapInstruction,
  findMatchingCloseTokenAccountInstruction,
  isCreateAssociatedTokenAccountInstruction,
  checkCreateTokenAccountMint
}
