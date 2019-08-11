const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

module.exports = function (app) {
  /**
   * given a beta password, will confirm if password is valid and has remaining logins
   *    if true then decrement remaining logins and return true; else return false
   */
  app.post('/betapassword/:password', handleResponse(async (req, res, next) => {
    let password = req.params.password

    if (!password) {
      return errorResponseBadRequest('Please provide password')
    }
    if (password === 'LOUD') { // whitelist LOUD password
      return successResponse({ status: true })
    }

    let passwordObj = await models.BetaPassword.findOne({ where: { password: password } })

    if (passwordObj && passwordObj.remainingLogins > 0) {
      await models.BetaPassword.decrement('remainingLogins', { where: { password: password } })
      return successResponse({ status: true })
    } else {
      return successResponse({ status: false })
    }
  }))
}
