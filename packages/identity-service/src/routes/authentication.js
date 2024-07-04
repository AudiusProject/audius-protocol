const sigUtil = require('eth-sig-util')
const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseForbidden,
  errorResponseUnauthorized
} = require('../apiHelpers')
const {
  validateOtp,
  shouldSendOtp,
  sendOtp,
  bypassOtp
} = require('../utils/otp')
const authMiddleware = require('../authMiddleware')

const EncodedDataMessageHeader = 'encoded-data-message'
const EncodedDataSignatureHeader = 'encoded-data-signature'

module.exports = function (app) {
  /**
   * This signup function writes the encryption values from the user's browser(iv, cipherText, lookupKey)
   * into the Authentications table and the email to the Users table. This is the first step in the
   * authentication process
   */
  app.post(
    '/authentication',
    handleResponse(async (req, res, next) => {
      const redis = req.app.get('redis')
      const sendgrid = req.app.get('sendgrid')
      if (!sendgrid) {
        req.logger.error('Missing sendgrid api key')
      }

      // body should contain {iv, cipherText, lookupKey}
      const body = req.body
      const headers = req.headers

      if (body && body.iv && body.cipherText && body.lookupKey) {
        try {
          const transaction = await models.sequelize.transaction()

          // default to null
          let walletAddress = null
          if (
            headers &&
            headers[EncodedDataMessageHeader] &&
            headers[EncodedDataSignatureHeader]
          ) {
            const encodedDataMessage = headers[EncodedDataMessageHeader]
            const encodedDataSignature = headers[EncodedDataSignatureHeader]
            try {
              walletAddress = sigUtil.recoverPersonalSignature({
                data: encodedDataMessage,
                sig: encodedDataSignature
              })
            } catch (err) {
              // keep address as null for future user recovery
              req.logger.error('Error recovering users signed address', err)
            }
          }

          const isChangingEmail =
            body.email !== undefined &&
            body.email !== null &&
            typeof body.email === 'string'
          const email = body.email
          if (isChangingEmail) {
            if (!body.oldLookupKey) {
              return errorResponseBadRequest(
                'Missing one of the required fields: oldLookupKey'
              )
            }

            // require signed headers for changing email
            if (walletAddress === null) {
              return errorResponseBadRequest('Invalid credentials')
            }

            const oldLookupKey = body.oldLookupKey
            // if user has wallet connected to auth artifacts, compare old lookupkey with wallet address
            const oldArtifacts = await models.Authentication.findOne({
              where: { lookupKey: oldLookupKey }
            })
            if (!oldArtifacts) {
              return errorResponseBadRequest('Invalid credentials')
            }

            if (
              oldArtifacts.walletAddress !== undefined &&
              oldArtifacts.walletAddress !== null
            ) {
              // if signature doesn't match old artifacts
              if (walletAddress !== oldArtifacts.walletAddress) {
                return errorResponseBadRequest('Invalid credentials')
              }
            }

            const otp = body.otp

            if (!otp) {
              await sendOtp({ email, redis, sendgrid })
              return errorResponseForbidden('Missing otp')
            }

            const isOtpValid = await validateOtp({ email, otp, redis })
            if (!isOtpValid) {
              return errorResponseBadRequest('Invalid credentials')
            }

            // change email of user who's signature was passed in the call
            // require wallet address from signature when updating email
            if (walletAddress !== null) {
              const userRecord = await models.User.findOne({
                where: { walletAddress },
                transaction
              })

              await userRecord.update({ email }, { transaction })
            }
          }

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
                lookupKey: body.lookupKey,
                walletAddress
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
      let email = emailParam ?? username
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

      const hasWalletAddressAssociated = existingUser.walletAddress != null

      if (!otp) {
        // use email from registered address if available
        try {
          if (hasWalletAddressAssociated) {
            const userRecord = await models.User.findOne({
              where: { walletAddress: existingUser.walletAddress }
            })

            if (userRecord.email === undefined || userRecord.email === null) {
              throw new Error(
                `existing user without email association ${JSON.stringify(
                  userRecord
                )} ${lookupKey}`
              )
            }

            if (email !== userRecord.email) {
              req.logger.error(
                {
                  reqEmail: email,
                  registeredEmail: userRecord.email,
                  lookupKey
                },
                'user email and auth param mismatch'
              )
              return errorResponseBadRequest('Invalid credentials')
            }

            email = userRecord.email
          }
        } catch (e) {
          req.logger.error(
            { lookupKey, error: e },
            `error getting user record from existing user '${e}'`
          )
        }

        if (await shouldSendOtp({ email, redis })) {
          await sendOtp({ email, redis, sendgrid })
        }
        return errorResponseForbidden('Missing otp')
      }

      const isOtpValid = await validateOtp({ email, otp, redis })

      if (!isOtpValid) {
        return errorResponseBadRequest('Invalid credentials')
      }

      if (isOtpValid && !hasWalletAddressAssociated) {
        try {
          const userRecord = await models.User.findOne({
            where: { email }
          })
          const walletAddress = userRecord.walletAddress
          await models.Authentication.update(
            {
              walletAddress
            },
            {
              where: { lookupKey }
            }
          )
        } catch (e) {
          req.logger.error(
            { email, lookupKey, error: e },
            `error associating wallet address '${e}'`
          )
        }
      }

      return successResponse(existingUser)
    })
  )
}
