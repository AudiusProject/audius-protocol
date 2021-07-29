const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { logger } = require('../logging')
const authMiddleware = require('../authMiddleware')
const { sign } = require('../utils/cognitoHelpers')

module.exports = (app) => {
  app.get('/cognito_signature', authMiddleware, handleResponse(async (req, res) => {
    const { walletAddress, handle } = req.user
    logger.info(`cognito_signature | Creating signature for: wallet '${walletAddress}', handle '${handle}'`)
    try {
      const signature = sign(handle)
      return successResponse({ signature })
    } catch (e) {
      logger.error(e)
      return errorResponseServerError({
        message: e.message
      })
    }
  }))
}
