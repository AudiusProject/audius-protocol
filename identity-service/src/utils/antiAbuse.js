const axios = require('axios')
const config = require('../config.js')
const { logger } = require('../logging')

const aaoEndpoint = config.get('aaoEndpoint') || 'https://antiabuseoracle.audius.co'

const getAbuseAttestation = async (challengeId, handle, reqIP) => {
  const res = await axios.post(`${aaoEndpoint}/attestation/${handle}`, {
    challengeId,
    challengeSpecifier: handle,
    amount: 0
  }, {
    headers: {
      'X-Forwarded-For': reqIP
    }
  })

  const data = res.data
  logger.info(`antiAbuse: aao response: ${JSON.stringify(data)}`)
  return data
}

const detectAbuse = async (user, challengeId, reqIP) => {
  let isAbusive = false
  let isAbusiveErrorCode = null

  if (!user.handle) {
    // Something went wrong during sign up and identity has no knowledge
    // of this user's handle. Flag them as abusive.
    isAbusive = true
  } else {
    try {
      const { result, errorCode } = await getAbuseAttestation(challengeId, user.handle, reqIP)
      if (!result) {
        // The anti abuse system deems them abusive. Flag them as such.
        isAbusive = true
        if (errorCode) {
          isAbusiveErrorCode = `${errorCode}`
        }
      }
    } catch (e) {
      logger.warn(`antiAbuse: aao request failed ${e.message}`)
    }
  }
  if (user.isAbusive !== isAbusive || user.isAbusiveErrorCode !== isAbusiveErrorCode) {
    await user.update({ isAbusive, isAbusiveErrorCode })
  }
}

module.exports = {
  getAbuseAttestation,
  detectAbuse
}
