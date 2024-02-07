const sendgridClient = require('@sendgrid/client')
const axios = require('axios')
const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseForbidden
} = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const captchaMiddleware = require('../captchaMiddleware')
const config = require('../config')
const { validateOtp, sendOtp } = require('../utils/otp')

const BOUNCER_BASE_URL = 'https://api.usebouncer.com/v1.1/email/verify'

const bouncerApiKey = config.get('bouncerEmailValidationKey')

const isEmailDeliverable = async (email, logger) => {
  try {
    const res = await axios.get(
      `${BOUNCER_BASE_URL}?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'x-api-key': bouncerApiKey
        }
      }
    )
    return res?.data?.status === 'undeliverable'
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
          const userEvent = await models.UserEvents.findOne({
            where: {
              walletAddress: existingUser.walletAddress
            }
          })
          if (!userEvent && !existingUser.handle) {
            // user does not have recovery email nor handle
            // delete existing user record to restart sign up
            existingUser.destroy()
            return successResponse({ exists: false })
          }
          return successResponse({ exists: true })
        } else {
          return successResponse({ exists: false })
        }
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
   * Change authenticated user's email address
   */
  app.put(
    '/user/email',
    authMiddleware,
    handleResponse(async (req, _res, _next) => {
      const { email, otp } = req.body ?? {}
      if (!email) {
        return errorResponseBadRequest('Missing email')
      }

      // Check OTP
      const redis = req.app.get('redis')
      const sendgrid = req.app.get('sendgrid')
      if (!sendgrid) {
        req.logger.error('Missing sendgrid api key')
      }

      if (!otp) {
        await sendOtp({ email, redis, sendgrid })
        return errorResponseForbidden('Missing otp')
      }

      const isOtpValid = await validateOtp({ email, otp, redis })
      if (!isOtpValid) {
        return errorResponseBadRequest('Invalid credentials')
      }

      // Update email
      const { blockchainUserId } = req.user
      await models.User.update(
        { email: req.body.email },
        { where: { blockchainUserId } }
      )
      return successResponse()
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
