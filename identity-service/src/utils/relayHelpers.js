const models = require("../models");
const config = require("../config");
const { SolanaUtils } = require("@audius/sdk");

const solanaRewardsManagerProgramId = config.get(
  "solanaRewardsManagerProgramId"
);
const solanaRewardsManager = config.get("solanaRewardsManagerProgramPDA");

const solanaClaimableTokenProgramAddress = config.get(
  "solanaClaimableTokenProgramAddress"
);
const solanaMintAddress = config.get("solanaMintAddress");
const solanaAudiusAnchorDataProgramId = config.get(
  "solanaAudiusAnchorDataProgramId"
);

const allowedProgramIds = new Set([
  solanaClaimableTokenProgramAddress,
  solanaRewardsManagerProgramId,
  /* secp */ "KeccakSecp256k11111111111111111111111111111",
]);

if (solanaAudiusAnchorDataProgramId) {
  allowedProgramIds.add(solanaAudiusAnchorDataProgramId);
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
  7: 1, // EvaluateAttestations
};

/**
 * Maps the instruction enum to the index of the claimable token authority account (derived from the base token account and the program id)
 * A value of -1 means the instruction is not allowed.
 *
 * @see {@link [../../../solana-programs/claimable-tokens/program/src/instruction.rs](https://github.com/AudiusProject/audius-protocol/blob/2c93f29596a1d6cc8ca4e76ef1f0d2e57f0e09e6/solana-programs/claimable-tokens/program/src/instruction.rs#L21)}
 */
const claimableTokenAuthorityIndices = {
  0: 2, // CreateTokenAccount
  1: 4, // Transfer
};

const isRelayAllowedProgram = (instructions) => {
  for (const instruction of instructions) {
    if (!allowedProgramIds.has(instruction.programId)) {
      return false;
    }
  }
  return true;
};

const isSendInstruction = (instr) =>
  instr.length &&
  instr[1] &&
  instr[1].programId === solanaClaimableTokenProgramAddress &&
  instr[1].data &&
  instr[1].data.data &&
  instr[1].data.data[0] === 1;

async function doesUserHaveSocialProof(userInstance) {
  const { blockchainUserId } = userInstance;
  const twitterUser = await models.TwitterUser.findOne({
    where: {
      blockchainUserId,
    },
  });

  const instagramUser = await models.InstagramUser.findOne({
    where: {
      blockchainUserId,
    },
  });
  return !!twitterUser || !!instagramUser;
}

const deriveClaimableTokenAuthority = async () => {
  return (
    await SolanaUtils.findProgramAddressFromPubkey(
      SolanaUtils.newPublicKeyNullable(solanaClaimableTokenProgramAddress),
      SolanaUtils.newPublicKeyNullable(solanaMintAddress)
    )
  )[0].toString();
};

let claimableTokenAuthority = null;
/**
 * Gets the authority account for the ClaimableToken program, using a cached value if possible
 * @returns {Promise<string>} the claimable token authority account as a string
 */
const getClaimableTokenAuthority = async () => {
  if (!claimableTokenAuthority) {
    claimableTokenAuthority = await deriveClaimableTokenAuthority();
  }
  return claimableTokenAuthority;
};

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
    return instruction.data.data[0];
  }
  return null;
};

/**
 * Returns the index of the requested account by mapping the instruction enum to the index via enum map
 * @param {Instruction} instruction
 * @param {Record<number, number | null>} enumMap the mapping of the instruction enum to the relevant account index
 * @returns {number | null} the index of the account of interest for that instruction type, or null
 */
const getAccountIndex = (instruction, enumMap) => {
  const instructionEnum = getInstructionEnum(instruction);
  if (
    instructionEnum !== null &&
    instructionEnum >= 0 &&
    instructionEnum < Object.keys(enumMap).length
  ) {
    return enumMap[instructionEnum];
  }
  return null;
};

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
    console.log("null");
    return true;
  } else if (
    instruction.keys &&
    accountIndex >= 0 &&
    accountIndex < instruction.keys.length
  ) {
    console.log(
      `${instruction.keys[accountIndex].pubkey} === ${expectedAccount}`
    );
    return instruction.keys[accountIndex].pubkey === expectedAccount;
  }
  console.log("false");
  return false;
};

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
    );
  } else if (instruction.programId === solanaClaimableTokenProgramAddress) {
    const claimableTokenAuthority = await getClaimableTokenAuthority();
    // Claimable token does not include the base account for the Transfer instruction
    // but does include the authority.
    return checkAccountKey(
      instruction,
      getAccountIndex(instruction, claimableTokenAuthorityIndices),
      claimableTokenAuthority
    );
  } else if (isRelayAllowedProgram([instruction])) {
    // Authority check not necessary
    return null;
  }
  // Not allowed program
  return false;
};

/**
 * Checks that all the given instructions have an allowed authority or base account (if applicable)
 * @param {Instruction[]} instructions
 * @returns true if all the instructions have allowed authorities/base accounts
 */
const areRelayAllowedInstructions = async (instructions) => {
  const results = await Promise.all(
    instructions.map((instruction) => isRelayAllowedInstruction(instruction))
  );
  // Explicitly check for false - null means N/A and should be passing
  if (results.some((result) => result === false)) {
    return false;
  }
  return true;
};

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  areRelayAllowedInstructions,
  isRelayAllowedProgram,
};
