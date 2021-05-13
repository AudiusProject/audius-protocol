const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { logger } = require('../logging')
const authMiddleware = require('../authMiddleware')
const { sign } = require('../utils/cognitoSignature')

module.exports = (app) => {
  app.get('/cognito_signature', authMiddleware, handleResponse(async (req, res) => {
    const { walletAddress } = req.user
    logger.info(`cognito_signature | Creating signature for ${walletAddress}`)
    try {
      const signature = sign(walletAddress)
      return successResponse({ signature })
    } catch (e) {
      logger.error(e)
      return errorResponseServerError({
        message: e.message
      })
    }
  }))
}
