const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')
const { QueryTypes } = require('sequelize')
const userHandleMiddleware = require('../userHandleMiddleware')
const authMiddleware = require('../authMiddleware')
const { getDeviceIDCountForUserId } = require('../utils/fpHelpers')

const getIP = (req) => {
  const forwardedFor = req.get('X-Forwarded-For')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim()
    return ip
  }
  return req.ip
}

module.exports = function (app) {
  app.get('/id_signals', userHandleMiddleware, handleResponse(async req => {
    if (req.headers['x-score'] !== config.get('scoreSecret')) {
      return errorResponseForbidden('Not permissioned to view scores.')
    }

    const handle = req.query.handle
    if (!handle) return errorResponseBadRequest('Please provide handle')

    const [captchaScores, cognitoFlowScores, socialHandles, twitterUser, instagramUser, deviceUserCount, userIPRecord] = await Promise.all([
      models.sequelize.query(
        `select "Users"."blockchainUserId" as "userId", "BotScores"."recaptchaScore" as "score", "BotScores"."recaptchaContext" as "context", "BotScores"."updatedAt" as "updatedAt"
        from 
          "Users" inner join "BotScores" on "Users"."walletAddress" = "BotScores"."walletAddress"
        where
          "Users"."handle" = :handle`,
        {
          replacements: { handle },
          type: QueryTypes.SELECT
        }
      ),
      models.sequelize.query(
        `select "Users"."blockchainUserId" as "userId", "CognitoFlows"."score" as "score"
        from 
          "Users" inner join "CognitoFlows" on "Users"."handle" = "CognitoFlows"."handle"
        where
          "Users"."handle" = :handle`,
        {
          replacements: { handle },
          type: QueryTypes.SELECT
        }
      ),
      models.SocialHandles.findOne({
        where: { handle }
      }),
      models.TwitterUser.findOne({
        where: {
          // Twitter stores case sensitive screen names
          'twitterProfile.screen_name': handle,
          verified: true
        }
      }),
      models.InstagramUser.findOne({
        where: {
          // Instagram does not store case sensitive screen names
          'profile.username': handle.toLowerCase(),
          verified: true
        }
      }),
      getDeviceIDCountForUserId(req.user.blockchainUserId),
      models.UserIPs.findOne({ where: { handle } })
    ])

    const response = { captchaScores, cognitoFlowScores, socialSignals: {}, deviceUserCount, userIP: userIPRecord && userIPRecord.userIP, emailAddress: req.user.email }
    if (socialHandles) {
      response.socialSignals = {
        ...socialHandles.dataValues,
        twitterVerified: !!twitterUser,
        instagramVerified: !!instagramUser
      }
    }
    return successResponse(response)
  }))

  app.get('/record_ip', authMiddleware, handleResponse(async req => {
    const { blockchainUserId, handle } = req.user
    const userIP = getIP(req)
    req.logger.info(`idSignals | record_ip | User IP is ${userIP} for user with id ${blockchainUserId} and handle ${handle}`)

    const record = await models.UserIPs.findOne({ where: { handle } })
    if (!record) {
      req.logger.info(`idSignals | record_ip | Saving IP ${userIP} for user ${handle}`)
      await models.UserIPs.create({
        handle,
        userIP
      })
    } else {
      // update even if IP has not changed so that we can later use updatedAt value if necessary
      req.logger.info(`idSignals | record_ip | Updating IP from ${record.userIP} to ${userIP} for user ${handle}`)
      await record.update({ userIP, updatedAt: Date.now() })
    }

    return successResponse({ userIP })
  }))
}
