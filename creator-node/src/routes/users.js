const ethereumUtils = require('ethereumjs-util')

const models = require('../models')
const { authMiddleware, syncLockMiddleware } = require('../middlewares')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const sessionManager = require('../sessionManager')
const utils = require('../utils')

module.exports = function (app) {
  app.post('/users', handleResponse(async (req, res, next) => {
    let walletAddress = req.body.walletAddress
    if (!ethereumUtils.isValidAddress(walletAddress)) {
      return errorResponseBadRequest('Ethereum address is invalid')
    }

    walletAddress = walletAddress.toLowerCase()

    const existingUser = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: walletAddress
      }
    })
    if (existingUser) {
      return successResponse() // do nothing if user already exists
    }

    await models.CNodeUser.create({ walletPublicKey: walletAddress })
    return successResponse()
  }))

  app.get('/users/login/challenge', handleResponse(async (req, res, next) => {
    const walletPublicKey = req.query.walletPublicKey
    const redisClient = req.app.get('redisClient')
    const challenge = (new Date()).getTime()
    redisClient.set(walletPublicKey, challenge)
    return successResponse({ walletPublicKey, challenge })
  }))

  app.post('/users/login', handleResponse(async (req, res, next) => {
    const { signature, data, challenge } = req.body

    const address = utils.verifySignature(data, signature)
    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }

    const theirTimestamp = parseInt(data.split(':')[1])
    // Conditionally verify challenge based on request parameters
    if (challenge) {
      req.logger.info(`Detected challenge ${challenge}`)
      const redisClient = req.app.get('redisClient')
      const redisValue = await redisClient.get(address)
      if (!redisValue) {
        return errorResponseBadRequest('Missing challenge key')
      }
      const ourTimestamp = parseInt(redisValue)
      if (theirTimestamp !== ourTimestamp) {
        return errorResponseBadRequest(`Found invalid response: User timestamp ${theirTimestamp}, Server timestamp ${ourTimestamp}`)
      } else {
        req.logger.info(`Found equal signatures: User timestamp ${theirTimestamp}, Server timestamp ${ourTimestamp}`)
      }
    } else {
      const ourTimestamp = Math.round((new Date()).getTime() / 1000)
      if (Math.abs(theirTimestamp - ourTimestamp) > 3600) {
        console.error(`Timestamp too old. User timestamp ${theirTimestamp}, Server timestamp ${ourTimestamp}`)
      }
    }

    // All checks have passed! generate a new session token for the user
    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  }))

  app.post('/users/logout', authMiddleware, syncLockMiddleware, handleResponse(async (req, res, next) => {
    await sessionManager.deleteSession(req.get(sessionManager.sessionTokenHeader))
    return successResponse()
  }))
}
