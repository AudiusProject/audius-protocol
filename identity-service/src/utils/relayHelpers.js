const models = require('../models')
const { libs } = require('@audius/sdk')
const {
  checkJupiterSwapInstruction,
  findMatchingCloseTokenAccountInstruction,
  isCreateAssociatedTokenAccountInstruction,
  isJupiterInstruction,
  checkCreateTokenAccountMint
} = require('./withdrawUSDCInstructionsHelpers')
const {
  solanaClaimableTokenProgramAddress,
  solanaMintAddress,
  solanaRewardsManager,
  solanaRewardsManagerProgramId,
  rewardManagerBaseAccountIndices,
  usdcMintAddress,
  claimableTokenAuthorityIndices,
  isRelayAllowedProgram,
  getInstructionEnum,
  isTransferToUserbank
} = require('./relayUtils')
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const SolanaUtils = libs.SolanaUtils

/**
 * @typedef {import('routes/solana').RelayInstruction} RelayInstruction
 */

const isSendInstruction = (instr) =>
  instr.length &&
  instr[1] &&
  instr[1].programId === solanaClaimableTokenProgramAddress &&
  instr[1].data &&
  instr[1].data.data &&
  instr[1].data.data[0] === 1

async function doesUserHaveSocialProof(userInstance) {
  const { blockchainUserId } = userInstance
  const twitterUser = await models.TwitterUser.findOne({
    where: {
      blockchainUserId
    }
  })

  const instagramUser = await models.InstagramUser.findOne({
    where: {
      blockchainUserId
    }
  })
  return !!twitterUser || !!instagramUser
}

const deriveClaimableTokenAuthority = async (mint) => {
  return (
    await SolanaUtils.findProgramAddressFromPubkey(
      SolanaUtils.newPublicKeyNullable(solanaClaimableTokenProgramAddress),
      SolanaUtils.newPublicKeyNullable(mint)
    )
  )[0].toString()
}

const claimableTokenAuthority = {}
/**
 * Gets the authority account for the ClaimableToken program, using a cached value if possible
 * @param {string} mint the mint account
 * @returns {Promise<string>} the claimable token authority account as a string
 */
const getClaimableTokenAuthority = async (mint) => {
  if (!(mint in claimableTokenAuthority)) {
    claimableTokenAuthority[mint] = await deriveClaimableTokenAuthority(mint)
  }
  return claimableTokenAuthority[mint]
}

/**
 * Returns the index of the requested account by mapping the instruction enum to the index via enum map
 * @param {RelayInstruction} instruction
 * @param {Record<number, number | null>} enumMap the mapping of the instruction enum to the relevant account index
 * @returns {number | null} the index of the account of interest for that instruction type, or null
 */
const getAccountIndex = (instruction, enumMap) => {
  const instructionEnum = getInstructionEnum(instruction)
  if (
    instructionEnum !== null &&
    instructionEnum >= 0 &&
    instructionEnum < Object.keys(enumMap).length
  ) {
    return enumMap[instructionEnum]
  }
  return null
}

class InvalidRelayInstructionError extends Error {
  /**
   * @param {number} instructionIndex
   * @param {string} message
   */
  constructor(instructionIndex, message) {
    super(`Instruction ${instructionIndex}: ${message}`)
    this.name = 'InvalidRelayInstructionError'
    this.instructionIndex = instructionIndex
  }
}

/**
 * Checks that all the instructions are allowed to be relayed.
 * This includes checking for:
 * - Correct authority or base account for use on our programs
 * - Allowed program IDs for third party programs
 * - Authentication for transfers to userbanks or Jupiter USDC=>SOL swaps
 * @throws {InvalidRelayInstructionError} errors on first validation failure
 */
const validateRelayInstructions = async (instructions, walletAddress) => {
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    if (isCreateAssociatedTokenAccountInstruction(instruction)) {
      const isMintAllowed = checkCreateTokenAccountMint(instruction)
      const matchingCloseInstructionIndex =
        findMatchingCloseTokenAccountInstruction(i, instructions)
      if (!isMintAllowed) {
        throw new InvalidRelayInstructionError(
          i,
          `Specified mint not allowed for create token account`
        )
      } else if (matchingCloseInstructionIndex === -1) {
        throw new InvalidRelayInstructionError(
          i,
          `Create token account instruction is missing matching close instruction`
        )
      }
    } else if (isJupiterInstruction(instruction)) {
      if (!walletAddress) {
        throw new InvalidRelayInstructionError(
          i,
          `Authentication required for swap instruction`
        )
      } else if (!checkJupiterSwapInstruction(i, instructions)) {
        throw new InvalidRelayInstructionError(
          i,
          `Invalid mints used in swap instruction`
        )
      }
    } else if (instruction.programId === solanaRewardsManagerProgramId) {
      // DeleteSenderPublic doesn't have the authority passed in, so use base account instead.
      // Since we've just checked the program ID, this is sufficient as the authority
      // is derived from the base account and program ID
      const expectedBaseAccount = solanaRewardsManager
      const baseAccountIndex = getAccountIndex(
        instruction,
        rewardManagerBaseAccountIndices
      )
      const actualBaseAccount = instruction.keys[baseAccountIndex]?.pubkey
      if (
        baseAccountIndex !== null &&
        actualBaseAccount !== expectedBaseAccount
      ) {
        throw new InvalidRelayInstructionError(
          i,
          `Invalid Rewards Manager Base Account: ${actualBaseAccount}`
        )
      }
    } else if (instruction.programId === solanaClaimableTokenProgramAddress) {
      const expectedAudioAuthority = await getClaimableTokenAuthority(
        solanaMintAddress
      )
      const expectedUsdcAuthority = await getClaimableTokenAuthority(
        usdcMintAddress
      )
      const authorityIndex = getAccountIndex(
        instruction,
        claimableTokenAuthorityIndices
      )
      const actualAuthority = instruction.keys[authorityIndex]?.pubkey
      // Claimable token does not include the base account for the Transfer instruction
      // but does include the authority.
      if (
        authorityIndex !== null &&
        actualAuthority !== expectedAudioAuthority &&
        actualAuthority !== expectedUsdcAuthority
      ) {
        throw new InvalidRelayInstructionError(
          i,
          `Unexpected Claimable Token Authority: ${actualAuthority}`
        )
      }
    } else if (instruction.programId === TOKEN_PROGRAM_ID.toBase58()) {
      if (!(await isTransferToUserbank(instruction, walletAddress))) {
        throw new InvalidRelayInstructionError(
          i,
          `Token program instruction not allowed`
        )
      }
    } else if (!isRelayAllowedProgram([instruction])) {
      throw new InvalidRelayInstructionError(
        i,
        `Not an allowed program: ${instruction.programId}`
      )
    }
  }
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  validateRelayInstructions
}
