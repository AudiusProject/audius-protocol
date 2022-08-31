const axios = require('axios')
const config = require('../config.js')
const { logger } = require('../logging')
const models = require('../models')

const aaoEndpoint = config.get('aaoEndpoint') || 'https://antiabuseoracle.audius.co'

/**
 * Gets IP of a user by using the leftmost forwarded-for entry
 * or defaulting to req.ip
 */
const getIP = (req) => {
  const forwardedFor = req.get('X-Forwarded-For')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim()
    return ip
  }
  return req.ip
}

/**
 * Records or updates the last seen IP for `handle`
 */
const recordIP = async (userIP, handle) => {
  const record = await models.UserIPs.findOne({ where: { handle } })
  if (!record) {
    await models.UserIPs.create({
      handle,
      userIP
    })
  } else {
    // update even if IP has not changed so that we can later use updatedAt value if necessary
    await record.update({ userIP, updatedAt: Date.now() })
  }
}

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
      // Write out the latest user IP to Identity DB - AAO will request it back
      await recordIP(reqIP, user.handle)

      const { result, errorCode } = await getAbuseAttestation(challengeId, user.handle, reqIP)
      if (!result) {
        // The anti abuse system deems them abusive. Flag them as such.
        isAbusive = true
        if (errorCode || errorCode === 0) {
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
  detectAbuse,
  getIP,
  recordIP
}
