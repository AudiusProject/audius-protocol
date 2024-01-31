const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseForbidden,
  errorResponseUnauthorized
} = require('../apiHelpers')
const { validateOtp, sendOtp, bypassOtp } = require('../utils/otp')
const authMiddleware = require('../authMiddleware')

module.exports = function (app) {
  /**
   * This signup function writes the encryption values from the user's browser(iv, cipherText, lookupKey)
   * into the Authentications table and the email to the Users table. This is the first step in the
   * authentication process
   */
  app.post(
    '/authentication',
    handleResponse(async (req, res, next) => {
      // body should contain {iv, cipherText, lookupKey}
      const body = req.body

      if (body && body.iv && body.cipherText && body.lookupKey) {
        try {
          const transaction = await models.sequelize.transaction()

          // Check if an existing record exists but is soft deleted (since the Authentication model is 'paranoid'
          // Setting the option paranoid to true searches both soft-deleted and non-deleted objects
          // https://sequelize.org/master/manual/paranoid.html
          // https://sequelize.org/master/class/lib/model.js~Model.html#static-method-findAll
          let existingRecord = await models.Authentication.findOne({
            where: { lookupKey: body.lookupKey },
            paranoid: false
          })
          if (!existingRecord) {
            await models.Authentication.create(
              {
                iv: body.iv,
                cipherText: body.cipherText,
                lookupKey: body.lookupKey
              },
              { transaction }
            )
          } else if (existingRecord.isSoftDeleted()) {
            await existingRecord.restore({ transaction })
          } else {
            // old auth artifacts may not be recoverable
            // restart sign up flow and overwrite existing auth artifacts
            existingRecord = await existingRecord.update({
              iv: body.iv,
              cipherText: body.cipherText,
              updatedAt: Date.now()
            })
          }

          const oldLookupKey = body.oldLookupKey
          if (oldLookupKey && oldLookupKey !== body.lookupKey) {
            await models.Authentication.destroy(
              { where: { lookupKey: oldLookupKey } },
              { transaction }
            )
          }
          await transaction.commit()
          return successResponse()
        } catch (err) {
          req.logger.error('Error signing up a user', err)
          return errorResponseBadRequest('Error signing up a user')
        }
      } else
        return errorResponseBadRequest(
          'Missing one of the required fields: iv, cipherText, lookupKey'
        )
    })
  )

  /**
   * Checks to see if a given lookup key exists in the authentications table.
   * Does not log a user in. Does not return credential information. Does not
   * send OTP emails. Requires a signed in user.
   */
  app.get(
    '/authentication/check',
    authMiddleware,
    handleResponse(async (req, _res, _next) => {
      const { lookupKey } = req.query
      if (!lookupKey) {
        return errorResponseBadRequest('Missing lookupKey')
      }

      const existingUser = await models.Authentication.findOne({
        where: { lookupKey }
      })
      if (!existingUser) {
        return errorResponseUnauthorized('Invalid credentials')
      }
      return successResponse()
    })
  )

  app.get(
    '/authentication',
    handleResponse(async (req, res, next) => {
      const { lookupKey, email: emailParam, username, otp } = req.query
      const email = emailParam ?? username
      if (!lookupKey) {
        return errorResponseBadRequest('Missing lookupKey')
      }

      if (!email) {
        return errorResponseBadRequest('Missing email')
      }

      const existingUser = await models.Authentication.findOne({
        where: { lookupKey }
      })
      if (!existingUser) {
        return errorResponseBadRequest('Invalid credentials')
      }

      if (bypassOtp(email)) {
        return successResponse(existingUser)
      }

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

      return successResponse(existingUser)
    })
  )
}
