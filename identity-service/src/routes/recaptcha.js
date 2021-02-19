const config = require('../config')
const { handleResponse, successResponse, errorResponseForbidden } = require('../apiHelpers')
const models = require('../models')

module.exports = function (app) {
  app.get('/captchascore', handleResponse(async (req, res, next) => {
    if (req.headers['x-captcha-score'] !== config.get('captchaScoreSecret')) {
      return errorResponseForbidden('Not permissioned to view captcha score.')
    }

    // TODO: make it take an array of userIds?
    const libs = req.app.get('audiusLibs')
    let response = {}
    let queryParams = req.query

    let userId
    if (queryParams && queryParams.id) {
      userId = parseInt(queryParams.id)
    }

    if (!userId) return successResponse({ msg: `userId is bad: ${userId}` })

    const users = await libs.User.getUsers(
      1 /* limit */,
      0 /* offset */,
      [userId]
    )
    if (!users.length) return successResponse({ msg: `users empty` })

    const recaptchaEntry = await models.RecaptchaScores.findOne({
      where: {
        walletAddress: users[0].wallet
      }
    })
    if (recaptchaEntry) {
      response = { score: recaptchaEntry.score }
    }

    return successResponse(response)
  }))
}
