const axios = require('axios')
const models = require('../models')
const { REMOTE_VARS, getRemoteVar } = require('../remoteConfig')
const config = require('../config.js')

const aaoEndpoint = getRemoteVar(
  optimizely, REMOTE_VARS.ORACLE_ENDPOINT
) || config.get('aaoEndpoint')

const getAbuseAttestation = async (challengeId, handle) => {
  const res = await axios.post(`${aaoEndpoint}/attestation/${handle}`, {
    challengeId,
    challengeSpecifier: handle,
    amount: 0
  })

  return res
}

const detectAbuse = async (challengeId, walletAddress) => {
  let isAbusive = false

  const user = await models.User.findOne({
    where: { walletAddress },
    attributes: ['blockchainUserId', 'walletAddress', 'handle', 'isAbusive']
  })
  if (!user.handle) {
    // Something went wrong during sign up and identity has no knowledge
    // of this user's handle. Flag them as abusive.
    isAbusive = true
  } else {
    const { result } = await getAbuseAttestation(challengeId, handle)
    if (!result) {
      // The anti abuse system deems them abusive. Flag them as such.
      isAbusive = true
    }
  }
  if (user.isAbusive !== isAbusive) {
    await user.update({ isAbusive })
  }
}

module.exports = {
  getAbuseAttestation,
  detectAbuse
}