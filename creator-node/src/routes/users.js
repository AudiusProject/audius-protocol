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
    console.log('CHALLENGE HIT')
    const walletPublicKey = req.params.walletPublicKey
    const redisClient = req.app.get('redisClient')
    const challenge = (new Date()).getTime()
    // const challengeKey = `${walletPublicKey}-${challenge}`
    redisClient.set(walletPublicKey, challenge)
    console.log('CHALLENGE REDIS KEY SET HIT')
    return successResponse({ walletPublicKey, challenge })
  }))

  app.post('/users/login', handleResponse(async (req, res, next) => {
    const { signature, data } = req.body

    const redisClient = req.app.get('redisClient')
    const address = utils.verifySignature(data, signature)
    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }
    const redisValue = await redisClient.get(address)
    console.error(`REDIS CHALLENGE - ${address} - ${redisValue}`)

    // signature data is valid and matches a user, proceed with verifying timestamp is
    // within time boundary
    const theirTimestamp = parseInt(data.split(':')[1])
    const ourTimestamp = Math.round((new Date()).getTime() / 1000)

    if (Math.abs(theirTimestamp - ourTimestamp) > 3600) {
      console.error(`Timestamp too old. User timestamp ${theirTimestamp}, Server timestamp ${ourTimestamp}`)
    }

    // all checks have passed! generate a new session token for the user
    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  }))

  app.post('/users/logout', authMiddleware, syncLockMiddleware, handleResponse(async (req, res, next) => {
    await sessionManager.deleteSession(req.get(sessionManager.sessionTokenHeader))
    return successResponse()
  }))
}
