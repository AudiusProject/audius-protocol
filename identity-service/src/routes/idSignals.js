const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')
const { QueryTypes } = require('sequelize')
const userHandleMiddleware = require('../userHandleMiddleware')
const { getDeviceIDCountForUserId } = require('../utils/fpHelpers')

module.exports = function (app) {
  app.get('/id_signals', userHandleMiddleware, handleResponse(async req => {
    if (req.headers['x-score'] !== config.get('scoreSecret')) {
      return errorResponseForbidden('Not permissioned to view scores.')
    }

    const handle = req.query.handle
    if (!handle) return errorResponseBadRequest('Please provide handle')

    const captchaScores = await models.sequelize.query(
      `select "Users"."blockchainUserId" as "userId", "BotScores"."recaptchaScore" as "score", "BotScores"."recaptchaContext" as "context", "BotScores"."updatedAt" as "updatedAt"
      from 
        "Users" inner join "BotScores" on "Users"."walletAddress" = "BotScores"."walletAddress"
      where
        "Users"."handle" = :handle`,
      {
        replacements: { handle },
        type: QueryTypes.SELECT
      }
    )

    const cognitoFlowScores = await models.sequelize.query(
      `select "Users"."blockchainUserId" as "userId", "CognitoFlows"."score" as "score"
      from 
        "Users" inner join "CognitoFlows" on "Users"."handle" = "CognitoFlows"."handle"
      where
        "Users"."handle" = :handle`,
      {
        replacements: { handle },
        type: QueryTypes.SELECT
      }
    )

    const socialHandles = await models.SocialHandles.findOne({
      where: { handle }
    })

    const twitterUser = await models.TwitterUser.findOne({
      where: {
        // Twitter stores case sensitive screen names
        'twitterProfile.screen_name': handle,
        verified: true
      }
    })

    const instagramUser = await models.InstagramUser.findOne({
      where: {
        // Instagram does not store case sensitive screen names
        'profile.username': handle.toLowerCase(),
        verified: true
      }
    })

    const deviceUserCount = await getDeviceIDCountForUserId(req.user.blockchainUserId)

    const response = { captchaScores, cognitoFlowScores, socialSignals: {}, deviceUserCount, emailAddress: req.user.email }
    if (socialHandles) {
      response.socialSignals = {
        ...socialHandles.dataValues,
        twitterVerified: !!twitterUser,
        instagramVerified: !!instagramUser
      }
    }
    return successResponse(response)
  }))
}
