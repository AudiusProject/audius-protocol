const models = require('../models')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const captchaMiddleware = require('../captchaMiddleware')

module.exports = function (app) {
  /**
   * Create a new user in the Users table
   * This is one part of a two part route along with POST /authentication
   * The user handle is not written here. that's added in /user/associate
   */
  app.post('/user', captchaMiddleware, handleResponse(async (req, res, next) => {
    // body should contain {username, walletAddress}
    // username is actually email, but hedgehog sends username
    let body = req.body
    if (body.username && body.walletAddress) {
      const email = body.username.toLowerCase()
      const existingUser = await models.User.findOne({
        where: {
          email: email
        }
      })

      if (existingUser) {
        return errorResponseBadRequest('Account already exists for user, try logging in')
      }
      const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress

      try {
        await models.User.create({
          email,
          // Store non checksummed wallet address
          walletAddress: body.walletAddress.toLowerCase(),
          lastSeenDate: Date.now(),
          IP
        })

        return successResponse()
      } catch (err) {
        req.logger.error('Error signing up a user', err)
        return errorResponseBadRequest('Error signing up a user')
      }
    } else return errorResponseBadRequest('Missing one of the required fields: email, walletAddress')
  }))

  /**
   * Check if a email address is taken. email is passed in via query param
   */
  app.get('/users/check', handleResponse(async (req, res, next) => {
    let email = req.query.email
    if (email) {
      email = email.toLowerCase()
      const existingUser = await models.User.findOne({
        where: {
          email: email
        }
      })

      if (existingUser) {
        return successResponse({ exists: true })
      } else return successResponse({ exists: false })
    } else return errorResponseBadRequest('Please pass in a valid email address')
  }))

  /**
   * Update User Timezone / IP
   */
  app.post('/users/update', authMiddleware, handleResponse(async (req, res, next) => {
    const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const { timezone } = req.body
    const { blockchainUserId } = req.user
    if (timezone) {
      try {
        await models.User.update(
          { IP, timezone },
          { where: { blockchainUserId } }
        )
        return successResponse()
      } catch (err) {
        req.logger.error('Error signing up a user', err)
        return errorResponseBadRequest('Error signing up a user')
      }
    }
    return errorResponseBadRequest('Invalid route parameters')
  }))

  /** DEPRECATED */

  app.post('/user/associate', handleResponse(async (req, res, next) => {
    return successResponse()
  }))

  app.get('/auth_migration', handleResponse(async (req, res, next) => {
    return successResponse()
  }))

  app.post('/auth_migration', handleResponse(async (req, res, next) => {
    return successResponse()
  }))
}
