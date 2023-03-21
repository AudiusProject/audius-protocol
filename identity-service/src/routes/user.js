const sendgridClient = require('@sendgrid/client')
const axios = require('axios')
const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const captchaMiddleware = require('../captchaMiddleware')
const config = require('../config')

sendgridClient.setApiKey(config.get('sendgridEmailValidationKey'))

const isEmailDeliverable = async (email, logger) => {
  const data = {
    email,
    source: 'signup'
  }

  const request = {
    url: '/v3/validations/email',
    method: 'POST',
    body: data
  }

  try {
    const [_, body] = await sendgridClient.request(request)
    return body.result.verdict !== 'Invalid'
  } catch (err) {
    // Couldn't figure out if delivable, so say it was
    logger.error(`Unable to validate email for ${email}`, err)
    return true
  }
}

module.exports = function (app) {
  /**
   * Create a new user in the Users table
   * This is one part of a two part route along with POST /authentication
   * The user handle is not written here. that's added in /user/associate
   */
  app.post(
    '/user',
    captchaMiddleware,
    handleResponse(async (req, res, next) => {
      // body should contain {username, walletAddress}
      // username is actually email, but hedgehog sends username
      const body = req.body
      if (body.username && body.walletAddress) {
        const email = body.username.toLowerCase()
        const existingUser = await models.User.findOne({
          where: {
            email: email
          }
        })

        if (existingUser) {
          return errorResponseBadRequest(
            'Account already exists for user, try logging in'
          )
        }
        const IP =
          req.headers['x-forwarded-for'] || req.connection.remoteAddress

        try {
          const isDeliverable = await isEmailDeliverable(email, req.logger)
          await models.User.create({
            email,
            // Store non checksummed wallet address
            walletAddress: body.walletAddress.toLowerCase(),
            lastSeenDate: Date.now(),
            IP,
            isEmailDeliverable: isDeliverable
          })

          return successResponse()
        } catch (err) {
          req.logger.error('Error signing up a user', err)
          return errorResponseBadRequest('Error signing up a user')
        }
      } else
        return errorResponseBadRequest(
          'Missing one of the required fields: email, walletAddress'
        )
    })
  )

  /**
   * Check if a email address is taken. email is passed in via query param
   */
  app.get(
    '/users/check',
    handleResponse(async (req, res, next) => {
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
      } else
        return errorResponseBadRequest('Please pass in a valid email address')
    })
  )

  /**
   * Update User Timezone / IP
   */
  app.post(
    '/users/update',
    authMiddleware,
    handleResponse(async (req, res, next) => {
      const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const { timezone } = req.body
      const { blockchainUserId } = req.user
      if (timezone) {
        try {
          // Associate the blockchain id with this user
          await models.User.update(
            { IP, timezone },
            { where: { blockchainUserId } }
          )
          // Create a user notification setting so the user can receive notifications
          models.UserNotificationSettings.findOrCreate({
            where: { userId: blockchainUserId },
            defaults: { userId: blockchainUserId }
          })

          return successResponse()
        } catch (err) {
          req.logger.error('Error signing up a user', err)
          return errorResponseBadRequest('Error signing up a user')
        }
      }
      return errorResponseBadRequest('Invalid route parameters')
    })
  )

  /**
   * Retrieve authenticated user's email address
   */
  app.get(
    '/user/email',
    authMiddleware,
    handleResponse(async (req, _res, _next) => {
      const { blockchainUserId } = req.user
      const userData = await models.User.findOne({
        where: {
          blockchainUserId
        }
      })

      return successResponse({
        email: userData.email
      })
    })
  )

  /** DEPRECATED */

  app.post(
    '/user/associate',
    handleResponse(async (req, res, next) => {
      return successResponse()
    })
  )

  app.get(
    '/auth_migration',
    handleResponse(async (req, res, next) => {
      return successResponse()
    })
  )

  app.post(
    '/auth_migration',
    handleResponse(async (req, res, next) => {
      return successResponse()
    })
  )
}
