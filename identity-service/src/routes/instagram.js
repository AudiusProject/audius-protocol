const request = require('request')
const config = require('../config.js')
const models = require('../models')
const uuidv4 = require('uuid/v4')

const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const { getRateLimiter } = require('../rateLimiter.js')

const instagramRateLimiter = getRateLimiter({
  prefix: 'instagramRateLimiter:'
})

/**
 * This file contains the instagram endpoints for oauth
 * For official documentation on the instagram oauth flow check out their site
 * https://www.instagram.com/developer/authentication/
 */
module.exports = function (app) {
  app.post(
    '/instagram',
    instagramRateLimiter,
    handleResponse(async (req, res, next) => {
      const { code } = req.body

      let reqObj = {
        method: 'post',
        url: 'https://api.instagram.com/oauth/access_token',
        form: {
          'client_id': config.get('instagramAPIKey'),
          'client_secret': config.get('instagramAPISecret'),
          'grant_type': 'authorization_code',
          'redirect_uri': `${req.headers.origin}`,
          code
        }
      }

      try {
        const res = await doRequest(reqObj)
        const igUser = JSON.parse(res)
        let {
          access_token: accessToken,
          user: profile
        } = igUser
        if (!accessToken || !profile) return errorResponseBadRequest(new Error('invalid code'))

        // Store access_token for user in db
        try {
          let uuid = uuidv4()
          models.InstagramUser.create({
            profile,
            accessToken,
            uuid
          })

          return successResponse({ profile, uuid })
        } catch (err) {
          return errorResponseBadRequest(err)
        }
      } catch (err) {
        return errorResponseBadRequest(err)
      }
    })
  )

  /**
   * After the user finishes onboarding in the client app and has a blockchain userId, we need to associate
   * the blockchainUserId with the instagram profile
   */
  app.post(
    '/instagram/associate',
    instagramRateLimiter,
    handleResponse(async (req, res, next) => {
      let { uuid, userId, handle } = req.body
      try {
        let instagramObj = await models.InstagramUser.findOne({ where: { uuid } })

        // only set blockchainUserId if not already set
        if (instagramObj && !instagramObj.blockchainUserId) {
          instagramObj.blockchainUserId = userId

          const socialHandle = await models.SocialHandles.findOne({ where: { handle } })
          if (socialHandle) {
            socialHandle.instagramHandle = instagramObj.profile.username
            await socialHandle.save()
          } else if (instagramObj.profile && instagramObj.profile.username) {
            await models.SocialHandles.create({
              handle,
              instagramHandle: instagramObj.profile.username
            })
          }

          // the final step is to save userId to db and respond to request
          try {
            await instagramObj.save()
            return successResponse()
          } catch (e) {
            return errorResponseBadRequest(e)
          }
        } else {
          req.logger.error('Instagram profile does not exist or userId has already been set', instagramObj)
          return errorResponseBadRequest('Instagram profile does not exist or userId has already been set')
        }
      } catch (err) {
        return errorResponseBadRequest(err)
      }
    })
  )
}

/**
 * Since request is a callback based API, we need to wrap it in a promise to make it async/await compliant
 * @param {Object} reqObj construct request object compatible with `request` module
 */
function doRequest (reqObj) {
  return new Promise(function (resolve, reject) {
    request(reqObj, function (err, r, body) {
      if (err) reject(err)
      else resolve(body)
    })
  })
}
