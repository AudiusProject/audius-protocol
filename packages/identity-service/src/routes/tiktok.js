const axios = require('axios')
const cors = require('cors')
const models = require('../models')
const config = require('../config.js')
const txRelay = require('../relay/txRelay')
const querystring = require('querystring')

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')

/**
 * This file contains the TikTok endpoints for oauth
 *
 * See: https://developers.tiktok.com/doc/login-kit-web
 */
module.exports = function (app) {
  app.get(
    '/tiktok',
    handleResponse(async (req, res, next) => {
      const csrfState = Math.random().toString(36).substring(7)
      res.cookie('csrfState', csrfState, { maxAge: 600000 })

      let url = 'https://www.tiktok.com/v2/auth/authorize/'

      url += `?client_key=${config.get('tikTokAPIKey')}`
      url += '&scope=user.info.basic'
      url += '&response_type=code'
      url += `&redirect_uri=${config.get('tikTokAuthOrigin')}`
      url += '&state=' + csrfState

      res.redirect(url)
    })
  )

  const accessTokenCorsOptions = {
    credentials: true,
    origin: true
  }

  app.options('/tiktok/access_token', cors(accessTokenCorsOptions))
  app.post(
    '/tiktok/access_token',
    cors(accessTokenCorsOptions),
    handleResponse(async (req, res, next) => {
      const { code, state } = req.body
      const { csrfState } = req.cookies

      if (!state || !csrfState || state !== csrfState) {
        return errorResponseBadRequest('Invalid state')
      }

      try {
        // Fetch user's accessToken
        const accessTokenResponse = await axios.post(
          'https://open.tiktokapis.com/v2/oauth/token/',
          querystring.stringify({
            client_key: config.get('tikTokAPIKey'),
            client_secret: config.get('tikTokAPISecret'),
            code,
            grant_type: 'authorization_code',
            redirect_uri: config.get('tikTokAuthOrigin')
          }),
          {
            headers: {
              'content-type': 'application/x-www-form-urlencoded'
            }
          }
        )

        const {
          access_token: accessToken,
          error: errorCode,
          error_description: errorMessage
        } = accessTokenResponse.data

        if (errorCode) {
          return errorResponseBadRequest(
            `Received error from tiktok oauth: ${errorCode} ${errorMessage}`
          )
        }

        // Fetch TikTok user from the TikTok API
        const userResponse = await axios.post(
          `https://open-api.tiktok.com/user/info/?access_token=${accessToken}`,
          {
            fields: [
              'open_id',
              'username',
              'display_name',
              'profile_deep_link',
              'is_verified'
            ]
          }
        )

        const { data, error } = userResponse.data

        if (error.code) {
          return errorResponseBadRequest(error.message)
        }

        const { user: tikTokUser } = data

        const existingTikTokUser = await models.TikTokUser.findOne({
          where: {
            uuid: tikTokUser.open_id,
            blockchainUserId: {
              [models.Sequelize.Op.not]: null
            }
          }
        })

        if (existingTikTokUser) {
          return errorResponseBadRequest(
            `Another Audius profile has already been authenticated with TikTok user @${tikTokUser.username}!`
          )
        } else {
          // Store the user id, and current profile for user in db
          await models.TikTokUser.upsert({
            uuid: tikTokUser.open_id,
            profile: tikTokUser,
            verified: tikTokUser.is_verified
          })
        }

        return successResponse({ data: accessTokenResponse.data })
      } catch (err) {
        return errorResponseBadRequest(err)
      }
    })
  )

  /**
   * After the user finishes onboarding in the client app and has a blockchain userId, we need to associate
   * the blockchainUserId with the tiktok profile so we can write the verified flag on chain
   */
  app.post(
    '/tiktok/associate',
    handleResponse(async (req, res, next) => {
      const { uuid, userId, handle } = req.body
      const audiusLibsInstance = req.app.get('audiusLibs')

      try {
        const tikTokObj = await models.TikTokUser.findOne({
          where: { uuid: uuid }
        })

        const user = await models.User.findOne({
          where: { handle }
        })

        const isUnassociated = tikTokObj && !tikTokObj.blockchainUserId
        const handlesMatch =
          tikTokObj &&
          tikTokObj.profile.username.toLowerCase() === user.handle.toLowerCase()

        // only set blockchainUserId if not already set
        if (isUnassociated && handlesMatch) {
          tikTokObj.blockchainUserId = userId

          // if the user is verified, write to chain, otherwise skip to next step
          if (tikTokObj.verified) {
            const [encodedABI, contractAddress] =
              await audiusLibsInstance.User.updateIsVerified(
                userId,
                config.get('userVerifierPrivateKey')
              )
            const senderAddress = config.get('userVerifierPublicKey')

            try {
              const txProps = {
                contractRegistryKey: 'EntityManager',
                contractAddress: contractAddress,
                encodedABI: encodedABI,
                senderAddress: senderAddress,
                gasLimit: null
              }
              await txRelay.sendTransaction(
                req,
                false,
                txProps,
                'tikTokVerified'
              )
            } catch (e) {
              return errorResponseBadRequest(e)
            }
          }

          const socialHandle = await models.SocialHandles.findOne({
            where: { handle }
          })
          if (socialHandle) {
            socialHandle.tikTokHandle = tikTokObj.profile.username
            await socialHandle.save()
          } else if (tikTokObj.profile && tikTokObj.profile.username) {
            await models.SocialHandles.create({
              handle,
              tikTokHandle: tikTokObj.profile.username
            })
          }

          // the final step is to save userId to db and respond to request
          try {
            await tikTokObj.save()
            return successResponse()
          } catch (e) {
            return errorResponseBadRequest(e)
          }
        } else {
          req.logger.error(
            `TikTok profile does not exist or userId has already been set for uuid: ${uuid}`,
            tikTokObj
          )
          return errorResponseBadRequest(
            'TikTok profile does not exist or userId has already been set'
          )
        }
      } catch (err) {
        return errorResponseBadRequest(err)
      }
    })
  )
}
