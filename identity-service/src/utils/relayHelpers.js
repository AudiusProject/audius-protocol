const models = require('../models')
const { libs } = require('@audius/sdk')
const {
  isUSDCWithdrawalTransaction
} = require('./withdrawUSDCInstructionsHelpers')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')
const {
  allowedProgramIds,
  solanaClaimableTokenProgramAddress,
  solanaMintAddress,
  solanaRewardsManager,
  solanaRewardsManagerProgramId,
  rewardManagerBaseAccountIndices,
  usdcMintAddress,
  claimableTokenAuthorityIndices,
  isRelayAllowedProgram,
  getInstructionEnum
} = require('./relayUtils')
const SolanaUtils = libs.SolanaUtils

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

let claimableTokenAuthority = {}
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
 * @param {Instruction} instruction
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
 * @param {Instruction} instruction
 * @param {number} accountIndex
 * @param {string} expectedAccount
 * @returns true if the account matches, or if the accountIndex is null
 */
const checkAccountKey = (instruction, accountIndex, expectedAccount) => {
  if (accountIndex == null) {
    console.log('null')
    return true
  } else if (
    instruction.keys &&
    accountIndex >= 0 &&
    accountIndex < instruction.keys.length
  ) {
    console.log(
      `${instruction.keys[accountIndex].pubkey} === ${expectedAccount}`
    )
    return instruction.keys[accountIndex].pubkey === expectedAccount
  }
  console.log('false')
  return false
}

/**
 * Checks the authority being used for the relayed instruction, if applicable
 * Ensures we relay only for instructions relevant to our programs and base account
 *
 * @param {Instruction} instruction
 * @returns true if the program authority matches, false if it doesn't, and null if not applicable
 */
const isRelayAllowedInstruction = async (instruction) => {
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
  } else if (isRelayAllowedProgram([instruction])) {
    // Authority check not necessary
    return null
  }
  // Not allowed program
  return false
}

/**
 * Checks that all the given instructions have an allowed authority or base account (if applicable)
 * @param {Instruction[]} instructions
 * @returns true if all the instructions have allowed authorities/base accounts
 */
const areRelayAllowedInstructions = async (instructions, optimizelyClient) => {
  const results = await Promise.all(
    instructions.map((instruction) => isRelayAllowedInstruction(instruction))
  )
  // Explicitly check for false - null means N/A and should be passing
  if (results.some((result) => result === false)) {
    // Special case for USDC withdraw transactions
    if (getFeatureFlag(optimizelyClient, FEATURE_FLAGS.USDC_PURCHASES)) {
      return isUSDCWithdrawalTransaction(instructions)
    }
    return false
  }
  return true
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  areRelayAllowedInstructions
}
