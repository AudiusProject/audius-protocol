const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const models = require('../models')
const DEVICE_TYPES = new Set(['ios', 'android'])

module.exports = function (app) {
  /**
   * Create or update mobile push notification settings
   * POST body contains {userId, settings: {favorites, milestonesAndAchievements, reposts, announcements, followers}}
   */
  app.post('/push_notifications/settings', handleResponse(async (req, res, next) => {
    const { userId, settings } = req.body

    if (!userId) return errorResponseBadRequest(`Did not pass in a valid userId`)

    try {
      await models.UserNotificationMobileSettings.upsert({
        userId,
        ...settings
      })

      return successResponse()
    } catch (e) {
      req.logger.error(`Unable to create or update push notification settings for userId: ${userId}`, e)
      return errorResponseServerError(`Unable to create or update push notification settings for userId: ${userId}, Error: ${e.message}`)
    }
  }))

  /**
   * Register a device token
   * POST body contains {deviceToken: <string>, deviceType: ios/android, userId}
   */
  app.post('/push_notifications/device_token', handleResponse(async (req, res, next) => {
    const { deviceToken, deviceType, userId } = req.body

    if (!DEVICE_TYPES.has(deviceType)) return errorResponseBadRequest('Attempting to register an invalid deviceType')
    if (!deviceToken || !userId) return errorResponseBadRequest('Did not pass in a valid deviceToken or userId for device token registration')

    try {
      await models.NotificationDeviceToken.upsert({
        deviceToken,
        deviceType,
        userId
      })

      return successResponse()
    } catch (e) {
      req.logger.error(`Unable to register device token for userId: ${userId} on ${deviceType}`, e)
      return errorResponseServerError(`Unable to register device token for userId: ${userId} on ${deviceType}, Error: ${e.message}`)
    }
  }))

  /**
   * Remove a device token from the device token table
   * POST body contains {deviceToken}
   */
  app.post('/push_notifications/device_token/deregister', handleResponse(async (req, res, next) => {
    const { deviceToken } = req.body
    if (!deviceToken) return errorResponseBadRequest('Did not pass in a valid deviceToken or userId for device token registration')

    let deleted = false
    try {
      const tokenObj = await models.NotificationDeviceToken.findOne({ where: {
        deviceToken
      } })

      if (tokenObj) {
        await tokenObj.destroy()
        deleted = true
      }

      return successResponse({ deleted })
    } catch (e) {
      req.logger.error(`Unable to deregister device token for userId: ${userId}`, e)
      return errorResponseServerError(`Unable to deregister device token for userId: ${userId}`, e.message)
    }
  }))
}
