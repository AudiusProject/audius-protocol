const request = require('request')
const retry = require('async-retry')
const config = require('../config.js')
const models = require('../models')
const txRelay = require('../relay/txRelay')
const { waitForUser } = require('../utils/waitForUser')

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../apiHelpers')

const generalAdmissionAddress = config.get('generalAdmissionAddress')

/**
 * This file contains the instagram endpoints for oauth
 * For official documentation on the instagram oauth flow check out their site
 * https://www.instagram.com/developer/authentication/
 */
module.exports = function (app) {
  /**
   * The first leg of the Instagram Oauth. Given an oauth code, it first
   * validates that the user owns the claimed account. Then it sends a
   * request to go pull the instagram graph API full user data.
   */
  app.post(
    '/instagram',
    handleResponse(async (req, res, next) => {
      const { code } = req.body

      const reqObj = {
        method: 'post',
        url: 'https://api.instagram.com/oauth/access_token',
        form: {
          client_id: config.get('instagramAPIKey'),
          client_secret: config.get('instagramAPISecret'),
          grant_type: 'authorization_code',
          redirect_uri: config.get('instagramRedirectUrl'),
          code
        }
      }

      try {
        const res = await doRequest(reqObj)
        const authAccessToken = JSON.parse(res)
        const { access_token: accessToken } = authAccessToken

        const instagramAPIUser = await doRequest({
          method: 'get',
          url: 'https://graph.instagram.com/me',
          qs: {
            fields: 'id,username,account_type',
            access_token: accessToken
          }
        })
        const igUser = JSON.parse(instagramAPIUser)
        if (igUser.error) {
          return errorResponseBadRequest(new Error(igUser.error.message))
        }
        const existingInstagramUser = await models.InstagramUser.findOne({
          where: {
            uuid: igUser.username,
            blockchainUserId: {
              [models.Sequelize.Op.not]: null
            }
          }
        })
        if (existingInstagramUser) {
          return errorResponseBadRequest(
            `Another Audius profile has already been authenticated with Instagram user @${igUser.username}!`
          )
        }
        // Fetch the instagram full profile
        const igProfileReqObj = {
          method: 'get',
          url: `${generalAdmissionAddress}/social/instagram/${igUser.username}`
        }

        try {
          const instagramProfileRes = await retry(
            async () => doRequest(igProfileReqObj),
            { retries: 3 }
          )
          const instagramProfile = JSON.parse(instagramProfileRes)

          // Store the access token, user id, and current profile for user in db
          await models.InstagramUser.upsert({
            uuid: igUser.username,
            profile: instagramProfile,
            verified: instagramProfile.is_verified,
            accessToken
          })

          return successResponse(instagramProfile)
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
    handleResponse(async (req, res, next) => {
      const { uuid, userId, handle, blockNumber } = req.body
      req.connection.setTimeout(60 * 1000)
      const audiusLibsInstance = req.app.get('audiusLibs')
      try {
        const instagramObj = await models.InstagramUser.findOne({
          where: { uuid }
        })
        const user = await waitForUser({
          userId,
          handle,
          blockNumber,
          audiusLibsInstance,
          logger: req.logger
        })

        const isUnassociated = instagramObj && !instagramObj.blockchainUserId
        const handlesMatch =
          instagramObj &&
          instagramObj.profile.username.toLowerCase() ===
            user.handle.toLowerCase()
        // only set blockchainUserId if not already set
        if (isUnassociated && handlesMatch) {
          instagramObj.blockchainUserId = userId

          // Update the user's social verification status along with the social app handle that verification came from.
          // If the user is not verified, send the transaction to ensure that their linked social handle is updated.
          const [encodedABI, contractAddress] =
            await audiusLibsInstance.User.updateSocialVerification(
              userId,
              config.get('userVerifierPrivateKey'),
              {
                is_verified: instagramObj.verified,
                instagram_handle: instagramObj.profile.username
              }
            )
          const senderAddress = config.get('userVerifierPublicKey')
          try {
            const txProps = {
              contractRegistryKey: 'EntityManager',
              contractAddress,
              encodedABI,
              senderAddress,
              gasLimit: null
            }
            await txRelay.sendTransaction(
              req,
              false,
              txProps,
              'instagramVerified'
            )
          } catch (e) {
            return errorResponseBadRequest(e)
          }

          const socialHandle = await models.SocialHandles.findOne({
            where: { handle }
          })
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
          req.logger.error(
            'Instagram profile does not exist or userId has already been set',
            instagramObj
          )
          return errorResponseBadRequest(
            'Instagram profile does not exist or userId has already been set'
          )
        }
      } catch (err) {
        return errorResponseBadRequest(err instanceof Error ? err.message : err)
      }
    })
  )
}

/**
 * Since request is a callback based API, we need to wrap it in a promise to make it async/await compliant
 * @param {Object} reqObj construct request object compatible with `request` module
 */
function doRequest(reqObj) {
  return new Promise(function (resolve, reject) {
    request(reqObj, function (err, r, body) {
      if (err) reject(err)
      else resolve(body)
    })
  })
}
