const audiusLibsWrapper = require('../audiusLibsInstance')
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

const SECP256K1_PROGRAM_ID = 'KeccakSecp256k11111111111111111111111111111'
const MEMO_PROGRAM_ID = 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'

const allowedProgramIds = new Set([
  solanaClaimableTokenProgramAddress,
  solanaRewardsManagerProgramId,
  SECP256K1_PROGRAM_ID,
  MEMO_PROGRAM_ID
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

/**
 * Map of instruction name to the enum used in the token program.
 * Incomplete, but more entries can be found here:
 * https://github.com/solana-labs/solana-program-library/blob/0a1cfdb90ccfa7745fd2aa35b1ad38ec8bcb6f88/token/program/src/instruction.rs#L523C15-L523C16
 */
const tokenInstructionEnum = /** @type {const} */ ({
  transferChecked: 12
})
/**
 * Map of account name to the index used in the token program's transfer_checked instruction
 */
const transferAccountIndices = /** @type {const} */ ({
  sender: 0,
  mint: 1,
  receiver: 2,
  authority: 3
})

/**
 * Checks to see if the instruction is an allowed token transfer.
 * Currently the only allowed transfers are to USDC userbanks
 * @param {Instruction} instruction
 * @param {string | undefined} walletAddress
 * @returns true if the instruction is allowed
 */
const isTransferToUserbank = async (instruction, walletAddress) => {
  if (!walletAddress) {
    // Without the wallet address of the calling user, we can't derive their userbank
    return false
  }
  if (
    getInstructionEnum(instruction) === tokenInstructionEnum.transferChecked
  ) {
    const mint = instruction.keys[transferAccountIndices.mint].pubkey
    const receiverAccount =
      instruction.keys[transferAccountIndices.receiver].pubkey
    if (mint === usdcMintAddress) {
      const derivedUserbank = await audiusLibsWrapper
        .getAudiusLibs()
        .solanaWeb3Manager.deriveUserBank({
          ethAddress: walletAddress,
          mint: 'usdc'
        })
      return derivedUserbank.toBase58() === receiverAccount
    }
  }
  return false
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
  getInstructionEnum,
  isTransferToUserbank
}
