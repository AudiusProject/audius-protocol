const ethereumUtils = require('ethereumjs-util')

const models = require('../models')
const authMiddleware = require('../authMiddleware')
const nodeSyncMiddleware = require('../redis').nodeSyncMiddleware
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

  app.post('/users/login', handleResponse(async (req, res, next) => {
    const signature = req.body.signature
    const data = req.body.data

    const address = utils.verifySignature(data, signature)
    const user = await models.CNodeUser.findOne({
      where: {
        walletPublicKey: address
      }
    })
    if (!user) {
      return errorResponseBadRequest('Invalid data or signature')
    }

    // signature data is valid and matches a user, proceed with verifying timestamp is
    // within time boundary
    const theirTimestamp = parseInt(data.split(':')[1])
    const ourTimestamp = Math.round((new Date()).getTime() / 1000)

    if (Math.abs(theirTimestamp - ourTimestamp) > 300) {
      return errorResponseBadRequest('Timestamp too old')
    }

    // all checks have passed! generate a new session token for the user
    const sessionToken = await sessionManager.createSession(user.cnodeUserUUID)
    return successResponse({ sessionToken })
  }))

  app.post('/users/logout', authMiddleware, nodeSyncMiddleware, handleResponse(async (req, res, next) => {
    await sessionManager.deleteSession(req.get(sessionManager.sessionTokenHeader))
    return successResponse()
  }))
}
