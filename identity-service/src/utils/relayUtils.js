const config = require('../config')
const solanaRewardsManagerProgramId = config.get(
  'solanaRewardsManagerProgramId'
)
const solanaRewardsManager = config.get('solanaRewardsManagerProgramPDA')

const solanaClaimableTokenProgramAddress = config.get(
  'solanaClaimableTokenProgramAddress'
)
const solanaMintAddress = config.get('solanaMintAddress')
const usdcMintAddress = config.get('solanaUSDCMintAddress')
const solanaAudiusAnchorDataProgramId = config.get(
  'solanaAudiusAnchorDataProgramId'
)

const allowedProgramIds = new Set([
  solanaClaimableTokenProgramAddress,
  solanaRewardsManagerProgramId,
  /* secp */ 'KeccakSecp256k11111111111111111111111111111',
  /* memo */ 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'
])

if (solanaAudiusAnchorDataProgramId) {
  allowedProgramIds.add(solanaAudiusAnchorDataProgramId)
}

/**
 * @typedef Instruction
 * @property {string} programId
 * @property {{data: number[], type: string}} data
 * @property {{pubkey: string, isSigner: boolean, isWriteable: boolean}[]} keys
 */

/**
 * Maps the instruction enum to the index of the rewards manager account (the base account of the program)
 * A value of -1 means the instruction is not allowed.
 *
 * @see {@link [../../../solana-programs/reward-manager/program/src/instruction.rs](https://github.com/AudiusProject/audius-protocol/blob/db31fe03f2c8cff357379b84130539d51ccca213/solana-programs/reward-manager/program/src/instruction.rs#L60)}
 * @type {Record<number, number | null>}
 */
const rewardManagerBaseAccountIndices = {
  0: -1, // InitRewardManager
  1: -1, // ChangeManagerAccount
  2: -1, // CreateSender
  3: -1, // DeleteSender
  4: 0, // CreateSenderPublic
  5: 0, // DeleteSenderPublic
  6: 1, // SubmitAttestations
  7: 1 // EvaluateAttestations
}

/**
 * Maps the instruction enum to the index of the claimable token authority account (derived from the base token account and the program id)
 * A value of -1 means the instruction is not allowed.
 *
 * @see {@link [../../../solana-programs/claimable-tokens/program/src/instruction.rs](https://github.com/AudiusProject/audius-protocol/blob/2c93f29596a1d6cc8ca4e76ef1f0d2e57f0e09e6/solana-programs/claimable-tokens/program/src/instruction.rs#L21)}
 */
const claimableTokenAuthorityIndices = {
  0: 2, // CreateTokenAccount
  1: 4 // Transfer
}

/**
 * Checks that each instruction is from a set of allowed programs.
 * @param {Instruction[]} instructions to check
 * @returns true if every instruction is from an allowed program
 */
const isRelayAllowedProgram = (instructions) => {
  for (const instruction of instructions) {
    if (!allowedProgramIds.has(instruction.programId)) {
      return false
    }
  }
  return true
}

/**
 * Gets the enum identifier of the instruction as determined by the first element of the data buffer
 * @param {Instruction} instruction
 * @returns the enum value of the given instruction
 */
const getInstructionEnum = (instruction) => {
  if (
    instruction.data &&
    instruction.data.data &&
    instruction.data.data.length > 0
  ) {
    return instruction.data.data[0]
  }
  return null
}

module.exports = {
  claimableTokenAuthorityIndices,
  rewardManagerBaseAccountIndices,
  solanaRewardsManager,
  solanaAudiusAnchorDataProgramId,
  solanaRewardsManagerProgramId,
  solanaClaimableTokenProgramAddress,
  solanaMintAddress,
  usdcMintAddress,
  allowedProgramIds,
  isRelayAllowedProgram,
  getInstructionEnum
}
