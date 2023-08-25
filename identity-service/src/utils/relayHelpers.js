const models = require('../models')
const config = require('../config')
const { libs } = require('@audius/sdk')
const {
  isUSDCWithdrawalTransaction
} = require('./withdrawUSDCInstructionsHelpers')
const SolanaUtils = libs.SolanaUtils

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

const isRelayAllowedProgram = (instructions) => {
  for (const instruction of instructions) {
    if (!allowedProgramIds.has(instruction.programId)) {
      return false
    }
  }
  return true
}

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
const areRelayAllowedInstructions = async (instructions) => {
  const results = await Promise.all(
    instructions.map((instruction) => isRelayAllowedInstruction(instruction))
  )
  // Explicitly check for false - null means N/A and should be passing
  if (results.some((result) => result === false)) {
    return isUSDCWithdrawalTransaction(instructions)
  }
  return true
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  areRelayAllowedInstructions,
  isRelayAllowedProgram
}

const testInstructions = [
  {
    programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    data: {
      type: 'Buffer',
      data: []
    },
    keys: [
      {
        pubkey: 'HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: 'CgdZKgU2Mj5wwY9THrEPJKknc7nk1YfCq9jXC3opBHRH',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      }
    ]
  },
  {
    programId: 'KeccakSecp256k11111111111111111111111111111',
    data: {
      type: 'Buffer',
      data: [
        1, 32, 0, 1, 12, 0, 1, 97, 0, 48, 0, 1, 56, 90, 209, 59, 139, 18, 138,
        13, 164, 85, 190, 39, 43, 49, 57, 242, 244, 179, 118, 47, 136, 59, 180,
        224, 158, 85, 2, 13, 48, 18, 131, 175, 87, 57, 154, 60, 100, 173, 191,
        34, 97, 170, 225, 240, 97, 192, 173, 238, 15, 168, 131, 250, 100, 231,
        158, 244, 11, 70, 88, 162, 185, 11, 107, 8, 53, 59, 87, 115, 142, 106,
        130, 70, 54, 125, 41, 30, 141, 117, 249, 33, 53, 201, 218, 136, 1, 173,
        151, 139, 14, 109, 104, 52, 1, 172, 110, 139, 116, 238, 173, 13, 80, 43,
        117, 200, 51, 125, 191, 34, 75, 140, 100, 215, 174, 120, 207, 88, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0
      ]
    },
    keys: []
  },
  {
    programId: '2sjQNmUfkV6yKKi4dPR8gWRgtyma5aiymE3aXL2RAZww',
    data: {
      type: 'Buffer',
      data: [
        1, 56, 90, 209, 59, 139, 18, 138, 13, 164, 85, 190, 39, 43, 49, 57, 242,
        244, 179, 118, 47
      ]
    },
    keys: [
      {
        pubkey: 'HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg',
        isSigner: true,
        isWritable: false
      },
      {
        pubkey: '4hbyJjqpWAbarjCQhY8YSeptZz1WYSS88DGqG4BteE3v',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'CgdZKgU2Mj5wwY9THrEPJKknc7nk1YfCq9jXC3opBHRH',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'EicLvE9mpatE5iSRDFc81X22DPq9Ti87jafLQGJRcbLj',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '87KVRgUiA8cDLxaSBjWnpNxd9fwDDWuSZsF1UhH7fhJd',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'SysvarRent111111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'Sysvar1nstructions1111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  },
  {
    programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    data: {
      type: 'Buffer',
      data: []
    },
    keys: [
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: true,
        isWritable: true
      },
      {
        pubkey: '7YGVxY7ceXosYRi3YcbaEXoWe7q5eujW4AaXZQ8jdt5V',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'So11111111111111111111111111111111111111112',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '11111111111111111111111111111111',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      }
    ]
  },
  {
    programId: 'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph',
    data: {
      type: 'Buffer',
      data: [228, 85, 185, 112, 78, 79, 77, 2]
    },
    keys: [
      {
        pubkey: '3HmXTbZf6G2oEjN3bPreZmF7YGLbbEXFkgAbVFPaimwU',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7YGVxY7ceXosYRi3YcbaEXoWe7q5eujW4AaXZQ8jdt5V',
        isSigner: false,
        isWritable: false
      }
    ]
  },
  {
    programId: 'JUP3c2Uh3WA4Ng34tw6kPd2G4C5BB21Xo36Je1s32Ph',
    data: {
      type: 'Buffer',
      data: [
        123, 229, 184, 63, 12, 0, 92, 145, 1, 47, 167, 0, 0, 0, 0, 0, 0, 208,
        78, 30, 0, 0, 0, 0, 0, 0, 0
      ]
    },
    keys: [
      {
        pubkey: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: true,
        isWritable: false
      },
      {
        pubkey: '83v8iPyZihDEjDdY8RdZddyZNyUtXngz69Lgo9Kt5d6d',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7YGVxY7ceXosYRi3YcbaEXoWe7q5eujW4AaXZQ8jdt5V',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'D3CDPQLoa9jY1LXCkpUqd3JQDWz8DX1LDE1dhmJt9fq4',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'CgdZKgU2Mj5wwY9THrEPJKknc7nk1YfCq9jXC3opBHRH',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'dwxR9YF7WwnJJu7bPC4UNcWFpcSsooH6fxbpoa3fTbJ',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'Eq6iwsQKwhFvJxbqn4p7Wm7f5xFFsCExdND4GXh7PMPN',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'FjZYAiSNqwkrMxeQ2tZxTVUz8CaaqumWAiZiFKdXP5Ys',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'GNvCR2Ur8tiHMdbW3724FT7Q8Hd1aA1xcBJEEZGgYxLq',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'GwRSc3EPw2fCLJN7zWwcApXgHSrfmj9m4H5sfk1W2SUJ',
        isSigner: false,
        isWritable: false
      },
      {
        pubkey: 'HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg',
        isSigner: false,
        isWritable: true
      }
    ]
  },
  {
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    data: {
      type: 'Buffer',
      data: [9]
    },
    keys: [
      {
        pubkey: '7YGVxY7ceXosYRi3YcbaEXoWe7q5eujW4AaXZQ8jdt5V',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: true,
        isWritable: false
      }
    ]
  },
  {
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    data: {
      type: 'Buffer',
      data: [9]
    },
    keys: [
      {
        pubkey: 'CgdZKgU2Mj5wwY9THrEPJKknc7nk1YfCq9jXC3opBHRH',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: 'HunCgdP91aVeoh8J7cbKTcFRoUwwhHwqYqVVLVkkqQjg',
        isSigner: false,
        isWritable: true
      },
      {
        pubkey: '7i4HiVgC72i4bVKQiPSbEEuMwQF5EA3xP9AbxWeFX84f',
        isSigner: true,
        isWritable: false
      }
    ]
  }
]

const test = async () => {
  return await areRelayAllowedInstructions(testInstructions)
}
console.log(test())
