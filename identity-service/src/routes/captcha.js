const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden, errorResponseBadRequest } = require('../apiHelpers')
const { sequelize } = require('../models')

module.exports = function (app) {
  app.get('/scores', handleResponse(async (req, res, next) => {
    if (req.headers['x-captcha-score'] !== config.get('captchaScoreSecret')) {
      return errorResponseForbidden('Not permissioned to view captcha score.')
    }

    let response = {}
    const queryParams = req.query

    // If ids are not passed in, return
    let userIds
    if (queryParams && queryParams.id) {
      userIds = queryParams.id
    }
    if (!userIds) return errorResponseBadRequest('No ids provided')

    // If not valid ids are passed in, return
    userIds = userIds.split(',').filter(id => parseInt(id))
    if (!userIds.length) return errorResponseBadRequest('No valid ids provided')

    const recaptchaEntry = await sequelize.query(
      `select "Users"."blockchainUserId" as "userId", "Users"."walletAddress" as "wallet", "BotScores"."recaptchaScore" as "score"
      from 
        "Users" inner join "BotScores" on "Users"."walletAddress" = "BotScores"."walletAddress"
      where
        "Users"."blockchainUserId" in (${userIds})`
    )

    response = recaptchaEntry[0].length ? recaptchaEntry[0] : response

    return successResponse(response)
  }))
}
