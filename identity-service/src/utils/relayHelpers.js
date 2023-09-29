const models = require('../models')
const { libs } = require('@audius/sdk')
const {
  checkJupiterSwapInstruction,
  findMatchingCloseTokenAccountInstruction,
  isCreateAssociatedTokenAccountInstruction,
  isJupiterInstruction,
  checkCreateTokenAccountMint
} = require('./withdrawUSDCInstructionsHelpers')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')
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

/**
 * Checks that the instruction's account at the accountIndex matches the expected account
 * Also passes if accountIndex is null, and fails if account index is outside the range of keys
 *
 * @param {RelayInstruction} instruction
 * @param {number} accountIndex
 * @param {string} expectedAccount
 * @returns true if the account matches, or if the accountIndex is null
 */
const checkAccountKey = (instruction, accountIndex, expectedAccount) => {
  if (accountIndex == null) {
    return true
  } else if (
    instruction.keys &&
    accountIndex >= 0 &&
    accountIndex < instruction.keys.length
  ) {
    return instruction.keys[accountIndex].pubkey === expectedAccount
  }
  return false
}

/**
 * Checks the authority being used for the relayed instruction, if applicable
 * Ensures we relay only for instructions relevant to our programs and base account
 *
 * @param {RelayInstruction} instruction
 * @param {string | undefined} walletAddress
 * @returns true if the program authority matches, false if it doesn't, and null if not applicable
 */
const isRelayAllowedInstruction = async (instruction, walletAddress) => {
  if (instruction.programId === solanaRewardsManagerProgramId) {
    // DeleteSenderPublic doesn't have the authority passed in, so use base account instead.
    // Since we've just checked the program ID, this is sufficient as the authority
    // is derived from the base account and program ID
    return checkAccountKey(
      instruction,
      getAccountIndex(instruction, rewardManagerBaseAccountIndices),
      solanaRewardsManager
    )
  } else if (instruction.programId === solanaClaimableTokenProgramAddress) {
    const audioAuthority = await getClaimableTokenAuthority(solanaMintAddress)
    const usdcAuthority = await getClaimableTokenAuthority(usdcMintAddress)
    // Claimable token does not include the base account for the Transfer instruction
    // but does include the authority.
    return (
      checkAccountKey(
        instruction,
        getAccountIndex(instruction, claimableTokenAuthorityIndices),
        audioAuthority
      ) ||
      checkAccountKey(
        instruction,
        getAccountIndex(instruction, claimableTokenAuthorityIndices),
        usdcAuthority
      )
    )
  } else if (instruction.programId === TOKEN_PROGRAM_ID.toBase58()) {
    return await isTransferToUserbank(instruction, walletAddress)
  } else if (isRelayAllowedProgram([instruction])) {
    // Authority check not necessary
    return true
  }
  // Not allowed program
  return false
}

/**
 * Checks that all the instructions are allowed to be relayed.
 * This includes checking for:
 * - Correct authority or base account for use on our programs
 * - Allowed program IDs for third party programs
 * - Authentication for transfers to userbanks or Jupiter USDC=>SOL swaps
 * @param {RelayInstruction[]} instructions The instructions to check
 * @param {string} walletAddress the wallet address if the user is authenticated
 * @returns a list of instruction indices that failed validation
 */
const validateRelayInstructions = async (instructions, walletAddress) => {
  /**
   * Defaults every instruction to false
   * @type {boolean[]}
   */
  const validations = new Array(instructions.length).fill(false)
  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]
    if (isCreateAssociatedTokenAccountInstruction(instruction)) {
      const isMintAllowed = checkCreateTokenAccountMint(instruction)
      const matchingCloseInstructionIndex =
        findMatchingCloseTokenAccountInstruction(i, instructions)
      if (isMintAllowed && matchingCloseInstructionIndex > -1) {
        validations[i] = true
        validations[matchingCloseInstructionIndex] = true
      }
    } else if (isJupiterInstruction(instruction)) {
      validations[i] =
        walletAddress && checkJupiterSwapInstruction(i, instructions)
    } else if (await isRelayAllowedInstruction(instruction, walletAddress)) {
      validations[i] = true
    }
  }
  return validations
    .map((isValid, index) => ({ index, isValid }))
    .filter((v) => v.isValid === false)
    .map((v) => v.index)
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  validateRelayInstructions
}
