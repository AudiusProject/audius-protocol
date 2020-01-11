const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const models = require('../models')
const config = require('../config')
const { createPlatformEndpoint, deleteEndpoint } = require('../awsSNS')

const iOSSNSParams = {
  PlatformApplicationArn: config.get('awsSNSiOSARN')
}
// const androidSNSParams = {
//   PlatformApplicationArn: config.get('awsSNSAndroidARN')
// }

const DEVICE_TYPES = new Set(['ios', 'android'])

module.exports = function (app) {
  /**
   * Get the settings for mobile push notifications for a user
   */
  app.get('/push_notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId

    if (!userId) return errorResponseBadRequest(`Did not pass in a valid userId`)

    try {
      const settings = await models.UserNotificationMobileSettings.findOne({ where: { userId } })

      return successResponse({ settings })
    } catch (e) {
      req.logger.error(`Unable to find push notification settings for userId: ${userId}`, e)
      return errorResponseServerError(`Unable to find push notification settings for userId: ${userId}, Error: ${e.message}`)
    }
  }))

  /**
   * Create or update mobile push notification settings
   * POST body contains {userId, settings: {favorites, milestonesAndAchievements, reposts, announcements, followers}}
   */
  app.post('/push_notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId
    const { settings } = req.body

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
  app.post('/push_notifications/device_token', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId
    const { deviceToken, deviceType } = req.body

    if (!DEVICE_TYPES.has(deviceType)) {
      return errorResponseBadRequest('Attempting to register an invalid deviceType')
    }
    if (!deviceToken || !userId) {
      return errorResponseBadRequest('Did not pass in a valid deviceToken or userId for device token registration')
    }

    try {
      const params = { ...iOSSNSParams, Token: deviceToken }
      const awsARN = (await createPlatformEndpoint(params))['EndpointArn']
      await models.NotificationDeviceToken.upsert({
        deviceToken,
        deviceType,
        userId,
        awsARN
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
  app.post('/push_notifications/device_token/deregister', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId
    const { deviceToken } = req.body

    if (!deviceToken) {
      return errorResponseBadRequest('Did not pass in a valid deviceToken or userId for device token registration')
    }

    let tokenDeleted = false
    let settingsDeleted = false
    try {
      // delete device token
      const tokenObj = await models.NotificationDeviceToken.findOne({
        where: {
          deviceToken,
          userId
        }
      })

      if (tokenObj) {
        // delete the endpoint from AWS SNS
        await deleteEndpoint({ EndpointArn: tokenObj.awsARN })
        await tokenObj.destroy()
        tokenDeleted = true
      }

      // delete user
      const settingsObj = await models.UserNotificationMobileSettings.findOne({
        where: {
          userId
        }
      })

      if (settingsObj) {
        await settingsObj.destroy()
        settingsDeleted = true
      }

      return successResponse({ tokenDeleted, settingsDeleted })
    } catch (e) {
      req.logger.error(`Unable to deregister device token for deviceToken: ${deviceToken}`, e)
      return errorResponseServerError(`Unable to deregister device token for deviceToken: ${deviceToken}`, e.message)
    }
  }))

  /**
   * Clear badge counts for a given user
   * POST body contains {userId}
   */
  app.post('/push_notifications/badges', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId

    try {
      await models.PushNotificationBadgeCounts.update(
        {
          iosBadgeCount: 0
        },
        {
          where: {
            userId
          }
        }
      )
      return successResponse()
    } catch (e) {
      return errorResponseServerError(`Unable to clear device notification badges for userId: ${userId}, Error: ${e.message}`)
    }
  }))
}
