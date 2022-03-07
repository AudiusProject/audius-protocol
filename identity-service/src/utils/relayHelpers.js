const models = require('../models')
const config = require('../config')

const solanaClaimableTokenProgramAddress = config.get('solanaClaimableTokenProgramAddress')
const solanaTrackListenCountAddress = config.get('solanaTrackListenCountAddress')
const solanaRewardsManagerProgramId = config.get('solanaRewardsManagerProgramId')

const allowedProgramIds = new Set([
  solanaClaimableTokenProgramAddress,
  solanaTrackListenCountAddress,
  solanaRewardsManagerProgramId,
  /* secp */ 'KeccakSecp256k11111111111111111111111111111',
  /* token program */ 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
])

const isRelayAllowedProgram = instructions => {
  for (const instruction of instructions) {
    if (!allowedProgramIds.has(instruction.programId)) {
      return false
    }
  }
  return true
}

const isSendInstruction = instr => instr.length &&
  instr[1] && instr[1].programId === solanaClaimableTokenProgramAddress &&
  instr[1].data &&
  instr[1].data.data &&
  instr[1].data.data[0] === 1

async function doesUserHaveSocialProof (userInstance) {
  const { blockchainUserId } = userInstance
  const twitterUser = await models.TwitterUser.findOne({ where: {
    blockchainUserId
  } })

  const instagramUser = await models.InstagramUser.findOne({ where: {
    blockchainUserId
  } })
  return !!twitterUser || !!instagramUser
}

module.exports = {
  isSendInstruction,
  doesUserHaveSocialProof,
  isRelayAllowedProgram
}
