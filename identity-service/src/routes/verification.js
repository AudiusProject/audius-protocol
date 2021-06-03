const axios = require('axios')

const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { logger } = require('../logging')
const authMiddleware = require('../authMiddleware')
const { sign } = require('../utils/cognitoSignature')
const audiusLibsWrapper = require('../audiusLibsInstance')

module.exports = (app) => {
  app.get('/cognito_signature', authMiddleware, handleResponse(async (req, res) => {
    const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
    const { walletAddress } = req.user
    logger.info(`cognito_signature | Creating signature for ${walletAddress}`)
    try {
      // Get the user's handle from discovery as identity does not have a complete state of the user object
      const response = await axios({
        method: 'get',
        url: `${discoveryProvider.discoveryProviderEndpoint}/users`,
        params: {
          wallet: walletAddress
        }
      })
      if (response.data.data.length !== 1) {
        throw new Error('Could not fetch user from discovery')
      }
      const { handle } = response.data.data[0]
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
