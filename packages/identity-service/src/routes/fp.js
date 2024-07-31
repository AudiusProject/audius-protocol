const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponse
} = require('../apiHelpers')
const models = require('../models')
const { logger } = require('../logging')
const { getDeviceIDCountForUserId } = require('../utils/fpHelpers')

module.exports = function (app) {
  app.get(
    '/fp',
    handleResponse(async (req) => {
      const { userId, origin } = req.query
      if (!userId || !origin || !['web', 'mobile', 'desktop'].includes(origin))
        return errorResponseBadRequest()

      try {
        const count = (
          await models.Fingerprints.findAll({
            where: {
              userId,
              origin
            }
          })
        ).length
        return successResponse({ count })
      } catch (e) {
        return errorResponse(
          `Something went wrong fetching fingerprint for user ${userId}: ${JSON.stringify(
            e
          )}`
        )
      }
    })
  )

  app.get(
    '/fp/counts/:userId',
    handleResponse(async (req) => {
      const userId = req.params.userId
      try {
        const counts = await getDeviceIDCountForUserId(userId)
        return successResponse({ counts })
      } catch (e) {
        return errorResponse(
          `Something went wrong fetching fp counts: ${JSON.stringify(e)}`
        )
      }
    })
  )
}
