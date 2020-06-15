const ethereumUtils = require('ethereumjs-util')
const crypto = require('crypto')
const base64url = require('base64-url')
const { promisify } = require('util')
const randomBytes = promisify(crypto.randomBytes)

const models = require('../models')
const { authMiddleware, syncLockMiddleware } = require('../middlewares')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const sessionManager = require('../sessionManager')
const utils = require('../utils')

const CHALLENGE_VALUE_LENGTH = 20
const CHALLENGE_TTL_SECONDS = 120
const CHALLENGE_PREFIX = 'userLoginChallenge:'

module.exports = function (app) {
  app.post('/users', handleResponse(async (req, res, next) => {
    const walletAddress = req.body.walletAddress
    const spID = req.body.spID || null

    console.log(`spID: ${spID} , type: ${ typeof(spID)}`)

    if (!ethereumUtils.isValidAddress(walletAddress)) {
      return errorResponseBadRequest('Invalid request body params')
    }

    const walletPublicKey = walletAddress.toLowerCase()

    // do nothing if CNodeUser already exists
    const existingUser = await models.CNodeUser.findOne({
      where: { walletPublicKey }
    })

    // if CNodeUser doesn't already exist, create it
    if (!existingUser) {
      await models.CNodeUser.create({
        walletPublicKey,
        spID
      })
    }

    // Never return cnodeUserUUID
    return successResponse()
  }))

  // TODO: to deprecate; leaving here for backwards compatibility
  app.post('/users/login', handleResponse(async (req, res, next) => {
    const { signature, data } = req.body

    if (!signature || !data) {
      return errorResponseBadRequest('Missing request body values.')
    }

    let address = utils.verifySignature(data, signature)
    address = address.toLowerCase()

    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }

    const theirTimestamp = parseInt(data.split(':')[1])
    const ourTimestamp = Math.round((new Date()).getTime() / 1000)

    if (Math.abs(theirTimestamp - ourTimestamp) > 3600) {
      console.error(`Timestamp too old. User timestamp ${theirTimestamp}, Server timestamp ${ourTimestamp}`)
    }

    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  }))

  /**
   * Return a challenge used for validating user login. Challenge value
   * is also set in redis cache with the key 'userLoginChallenge:<wallet>'.
   */
  app.get('/users/login/challenge', handleResponse(async (req, res, next) => {
    let walletPublicKey = req.query.walletPublicKey

    if (!walletPublicKey) {
      return errorResponseBadRequest('Missing wallet address.')
    }

    walletPublicKey = walletPublicKey.toLowerCase()
    const userLoginChallengeKey = `${CHALLENGE_PREFIX}${walletPublicKey}`
    const redisClient = req.app.get('redisClient')
    const challengeBuffer = await randomBytes(CHALLENGE_VALUE_LENGTH)
    const challengeBytes = base64url.encode(challengeBuffer)
    const challenge = `Click sign to authenticate with creator node: ${challengeBytes}`

    // Set challenge ttl to 2 minutes ('EX' option = sets expire time in seconds)
    // https://redis.io/commands/set
    // https://github.com/luin/ioredis/blob/master/examples/basic_operations.js#L44
    await redisClient.set(userLoginChallengeKey, challenge, 'EX', CHALLENGE_TTL_SECONDS)

    return successResponse({ walletPublicKey, challenge })
  }))

  /**
   * Checks if challenge in request body matches up with what we have stored.
   * If request challenge matches what we have, remove instance from redis to
   * prevent replay attacks. Return sessionToken upon success.
   */
  app.post('/users/login/challenge', handleResponse(async (req, res, next) => {
    const { signature, data: theirChallenge } = req.body
    console.log(`signature: ${signature}, theirchallenge: ${theirChallenge}`)

    if (!signature || !theirChallenge) {
      return errorResponseBadRequest('Missing request body values.')
    }

    let address
    try {
      console.log('attempting to utils.verifySignature')
      address = utils.verifySignature(theirChallenge, signature)
      address = address.toLowerCase()
    } catch (e) {
      return errorResponseBadRequest(`Unable to verify signature: ${e}`)
    }

    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }

    console.log('attempting to redisClient.get')
    const redisClient = req.app.get('redisClient')
    const userLoginChallengeKey = `${CHALLENGE_PREFIX}${address}`
    const ourChallenge = await redisClient.get(userLoginChallengeKey)

    if (!ourChallenge) {
      return errorResponseBadRequest('Missing challenge key')
    }

    if (theirChallenge !== ourChallenge) {
      return errorResponseBadRequest(`Invalid response.`)
    }

    console.log('attempting to redisClient.del')
    await redisClient.del(userLoginChallengeKey)

    // All checks have passed! generate a new session token for the user
    console.log('attempting to sessionMgr.createSession')
    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  }))

  app.post('/users/logout', authMiddleware, syncLockMiddleware, handleResponse(async (req, res, next) => {
    await sessionManager.deleteSession(req.get(sessionManager.sessionTokenHeader))
    return successResponse()
  }))
}
