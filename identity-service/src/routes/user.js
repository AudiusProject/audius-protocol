const models = require('../models')
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
