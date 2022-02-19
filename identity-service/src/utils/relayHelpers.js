const models = require('../models')
const config = require('../config')

const solanaClaimableTokenProgramAddress = config.get('solanaClaimableTokenProgramAddress')

const isSendInstruction = instr => instr.length &&
  instr[1] && instr[1].programId === solanaClaimableTokenProgramAddress &&
  instr[1].data &&
  instr[1].data.data &&
  instr[1].data.data[0] === 1

async function isUserVerified (userInstance) {
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
  isUserVerified
}
