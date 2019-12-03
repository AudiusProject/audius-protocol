const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

module.exports = function (app) {
  app.get('/userEvents', handleResponse(async (req, res) => {
    const { walletAddress } = req.query
    if (!walletAddress) {
      return errorResponseBadRequest('Please provide a wallet address')
    }
    try {
      const userEvents = await models.UserEvents.findOne({
        where: {
          walletAddress
        }
      })
      if (!userEvents) throw new Error(`UserEvents for ${walletAddress} not found`)
      return successResponse(userEvents)
    } catch (e) {
      req.logger.error(e)
      // no-op. No user events.
      return successResponse({})
    }
  }))
}
