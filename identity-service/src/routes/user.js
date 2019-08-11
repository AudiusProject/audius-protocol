const models = require('../models')
const { recoverPersonalSignature } = require('eth-sig-util')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')

module.exports = function (app) {
  /**
   * Create a new user in the Users table
   * This is one part of a two part route along with POST /authentication
   * The user handle is not written here. that's added in /user/associate
   */
  app.post('/user', handleResponse(async (req, res, next) => {
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

      try {
        await models.User.create({
          email: email,
          // Store non checksummed wallet address
          walletAddress: body.walletAddress.toLowerCase(),
          lastSeenDate: Date.now()
        })

        return successResponse()
      } catch (err) {
        req.logger.error('Error signing up a user', err)
        return errorResponseBadRequest('Error signing up a user')
      }
    } else return errorResponseBadRequest('Missing one of the required fields: email, walletAddress')
  }))

  /**
   * Second step in the user signup flow. This correlates the User record written during
   * /user/sign_up with a handle
   *
   * Shared libs sends { username and handle } in body. username is the property that hedgehog sends
   * so shared libs emulates that consistency. username on the body is actually the email address
   */
  app.post('/user/associate', handleResponse(async (req, res, next) => {
    let body = req.body

    if (body && body.username && body.handle && body.signature && body.data) {
      const data = body.data
      const signature = body.signature
      const address = recoverPersonalSignature({ data: data, sig: signature })

      // username is actually email, property is called username to be consistent with hedgehog's parameters
      const email = body.username.toLowerCase()
      const user = await models.User.findOne({
        where: {
          walletAddress: address
        }
      })
      // Confirm caller has possession of correct wallet address
      if (!user) {
        return errorResponseBadRequest('Invalid data or signature')
      }
      let matchingEmail = user.email === email
      if (!matchingEmail) {
        return errorResponseBadRequest('Invalid email provided')
      }

      const existingUser = await models.User.findOne({
        where: {
          email: email
        }
      })

      if (!existingUser) {
        return errorResponseBadRequest(`Cannot associate for user that doesn't exist`)
      }

      if (existingUser.walletAddress && existingUser.handle) {
        return errorResponseBadRequest(`Values already associated for user`)
      }
      existingUser.handle = body.handle
      existingUser.isConfigured = true

      await existingUser.save()

      await models.AuthMigration.create({ handle: body.handle })

      return successResponse()
    } else return errorResponseBadRequest('Missing one of the required fields: username, handle, signature, data')
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
}
