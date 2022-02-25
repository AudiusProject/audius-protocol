const { handleResponse, successResponse } = require('../apiHelpers')

module.exports = function (app) {
  app.get(
    '/cm',
    handleResponse(async (req, res) => {
      const trustedNotifierManager = req.app.get('trustedNotifierManager')
      const emailAddress =
        trustedNotifierManager.getTrustedNotifierData().emailAddress ||
        'Email address unavailable at the moment'
      const response = {
        emailAddress
      }
      return successResponse(response)
    })
  )
}
