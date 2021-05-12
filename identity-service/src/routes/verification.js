const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { logger } = require('../logging')
const authMiddleware = require('../authMiddleware')
const { sign } = require('../utils/cognitoSignature')

module.exports = (app) => {
  app.get('/cognito_signature', authMiddleware, handleResponse(async (req, res) => {
    const { handle } = req.user
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
