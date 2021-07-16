const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const models = require('../models')
const { QueryTypes } = require('sequelize')
const userHandleMiddleware = require('../userHandleMiddleware')
const authMiddleware = require('../authMiddleware')
const { verify } = require('hcaptcha')
const HCAPTCHA_SECRET = config.get('hCaptchaSecret')

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

  app.post('/score', authMiddleware, handleResponse(async req => {
    const user = req.user
    const token = req.body.token

    if (!token) {
      return errorResponseBadRequest('Please provide hCaptcha token.')
    }

    try {
      const { success, hostname } = await verify(HCAPTCHA_SECRET, token)

      if (!success) {
        return errorResponseServerError('hCaptcha Verification failed.')
      }

      // save hCaptcha score for user in BotScores
      await models.BotScores.create({
        walletAddress: user.walletAddress,
        // hCaptcha scores represent risk scores
        // the score values go from 0 to 1
        // the higher the score the worse it is
        // e.g. 0 is 'safe' and 1 is 'bot'
        // given we are using the free publisher tier of hCaptcha, we only get the binary success/fail and no score value
        // therefore we use the score of 1 to denote that verification was ok and remain consistent with our other scores
        recaptchaScore: 1,
        // the recaptcha context is very important because that's how we know whether
        // the score is from hCaptcha, meaning 0 is best
        // or if it's from our other recpatcha scores, where 1 is best
        recaptchaContext: 'hCaptcha',
        recaptchaHostname: hostname
      })
      return successResponse({})
    } catch (err) {
      console.error(err)
      return errorResponseServerError(err.message)
    }
  }))
}
