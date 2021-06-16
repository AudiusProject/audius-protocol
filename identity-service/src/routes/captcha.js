const config = require('../config')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseForbidden } = require('../apiHelpers')
const { sequelize } = require('../models')

module.exports = function (app) {
  app.get('/scores', handleResponse(async req => {
    const handle = req.query.handle
    if (!handle) {
      return errorResponseBadRequest('Please provide handle.')
    }

    if (req.headers['x-captcha-score'] !== config.get('captchaScoreSecret')) {
      return errorResponseForbidden('Not permissioned to view captcha scores.')
    }

    const recaptchaEntries = await sequelize.query(
      `select "Users"."blockchainUserId" as "userId", "Users"."walletAddress" as "wallet", "BotScores"."recaptchaScore" as "score", "BotScores"."recaptchaContext" as "context"
      from 
        "Users" inner join "BotScores" on "Users"."walletAddress" = "BotScores"."walletAddress"
      where
        "Users"."handle" = ${handle}`
    )

    return successResponse(recaptchaEntries)
  }))
}
