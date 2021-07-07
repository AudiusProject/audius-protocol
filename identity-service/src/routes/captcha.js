const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden } = require('../apiHelpers')
const models = require('../models')
const { QueryTypes } = require('sequelize')
const userHandleMiddleware = require('../userHandleMiddleware')

module.exports = function (app) {
  app.get('/scores', userHandleMiddleware, handleResponse(async req => {
    if (req.headers['x-captcha-score'] !== config.get('captchaScoreSecret')) {
      return errorResponseForbidden('Not permissioned to view captcha scores.')
    }

    const handle = req.query.handle

    const recaptchaEntries = await models.sequelize.query(
      `select "Users"."blockchainUserId" as "userId", "Users"."walletAddress" as "wallet", "BotScores"."recaptchaScore" as "score", "BotScores"."recaptchaContext" as "context"
      from 
        "Users" inner join "BotScores" on "Users"."walletAddress" = "BotScores"."walletAddress"
      where
        "Users"."handle" = :handle`,
      {
        replacements: { handle },
        type: QueryTypes.SELECT
      }
    )

    return successResponse(recaptchaEntries)
  }))
}
