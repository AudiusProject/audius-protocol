const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const models = require('../models')
const authMiddleware = require('../authMiddleware')

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

  /* Updates that UserEvent table w/ if the user has sign in w/ native mobile
  *
  * @param {boolean} hasSignedInNativeMobile   If the user has signed in w/ native mobile
  */
  app.post('/userEvents', authMiddleware, handleResponse(async (req, res) => {
    const user = await models.User.findOne({
      where: { id: req.user.id },
      attributes: ['walletAddress']
    })
    const walletAddress = user.walletAddress
    const hasSignedInNativeMobile = !!req.body.hasSignedInNativeMobile
    try {
      if (hasSignedInNativeMobile) {
        await models.UserEvents.upsert({
          walletAddress,
          hasSignedInNativeMobile
        })
      } else {
        // Note: The field `hasSignedInNativeMobile` defaults to false on create, but if already
        // true, do not convert to false.
        await models.UserEvents.findOrCreate({ where: { walletAddress } })
      }
      return successResponse({})
    } catch (e) {
      req.logger.error(e)
      console.log(e)
      return errorResponseServerError('Unable to create user event')
    }
  }))
}
