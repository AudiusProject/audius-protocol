const { handleResponse, successResponse } = require('../apiHelpers')

module.exports = function (app) {
  app.get(
    '/contact',
    handleResponse(async (req, res) => {
      const trustedNotifierManager = req.app.get('trustedNotifierManager')
      const email =
        trustedNotifierManager.getTrustedNotifierData().email ||
        'Email address unavailable at the moment'
      const response = {
        email
      }
      return successResponse(response)
    })
  )
}
