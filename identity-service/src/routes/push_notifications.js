const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')
const DEVICE_TYPES = new Set(['ios', 'android'])

module.exports = function (app) {
  /**
   * Create or update mobile push notification settings
   */
  app.post('/push_notifications/settings', handleResponse(async (req, res, next) => {
    return successResponse()
  }))

  /**
   * Register a device token
   * POST body contains {token: <string>, deviceType: ios/android}
   */
  app.post('/push_notifications/device_token', handleResponse(async (req, res, next) => {
    console.log(req.body)
    const { token, deviceType } = req.body
    if (!DEVICE_TYPES.has(deviceType)) return errorResponseBadRequest('Invalid deviceType')
    return successResponse()
  }))

  /**
   * Remove a device token from the device token table
   */
  app.post('/push_notifications/device_token/logout', handleResponse(async (req, res, next) => {
    return successResponse()
  }))
}
