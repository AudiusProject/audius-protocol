const request = require('request')
const qs = require('querystring')
const config = require('../config.js')
const models = require('../models')
const uuidv4 = require('uuid/v4')
const txRelay = require('../relay/txRelay')

const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')

/**
 * This file contains the twitter endpoints for oauth
 * For a great article about the walkthrough of the oauth process visit this link
 * https://medium.com/@robince885/how-to-do-twitter-authentication-with-react-and-restful-api-e525f30c62bb
 */
module.exports = function (app) {
  /**
   * The first leg of the Twitter Oauth. It asks twitter for a request token, and this
   * token gets sent to the client which will redirect to twitter for the user's authorization
   */
  app.post('/twitter', handleResponse(async (req, res, next) => {
    let reqObj = {
      method: 'post',
      url: 'https://api.twitter.com/oauth/request_token',
      oauth: {
        oauth_callback: req.headers.origin,
        consumer_key: config.get('twitterAPIKey'),
        consumer_secret: config.get('twitterAPISecret')
      }
    }

    try {
      let body = await doRequest(reqObj)
      let responseData = qs.parse(body)
      return successResponse(responseData)
    } catch (err) {
      return errorResponseBadRequest(err)
    }
  }))

  /**
   * When the user clicks authorize and twitter calls back to the client, the client calls this route and
   * passes the oauth token and verifier via query params. This route will use the token and verifier and
   * calls Twitter for the oauth token and secret and then make a request to get the user profile
   * and returns it to the client
   */
  app.post('/twitter/callback', handleResponse(async (req, res, next) => {
    let reqObj = {
      method: 'post',
      url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
      oauth: {
        consumer_key: config.get('twitterAPIKey'),
        consumer_secret: config.get('twitterAPISecret'),
        token: req.query.oauth_token
      },
      form: { oauth_verifier: req.query.oauth_verifier }
    }

    try {
      let body = await doRequest(reqObj)
      let responseData = qs.parse(body)

      let userRequest = {
        method: 'get',
        url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
        oauth: {
          consumer_key: config.get('twitterAPIKey'),
          consumer_secret: config.get('twitterAPISecret'),
          token: responseData.oauth_token,
          token_secret: responseData.oauth_token_secret
        },
        json: true
      }
      let userProfile = await doRequest(userRequest)
      userProfile.verified = true
      try {
        let uuid = uuidv4()
        models.TwitterUser.create({
          twitterProfile: userProfile,
          verified: userProfile.verified,
          uuid: uuid
        })

        return successResponse({ profile: userProfile, uuid: uuid })
      } catch (err) {
        return errorResponseBadRequest(err)
      }
    } catch (err) {
      return errorResponseBadRequest(err)
    }
  }))

  app.get('/twitter/handle_lookup', handleResponse(async (req, res, next) => {
    const handle = req.query.handle
    if (handle) {
      let userRequest = {
        method: 'get',
        url: `https://api.twitter.com/1.1/users/lookup.json?screen_name=${handle}`,
        oauth: {
          consumer_key: config.get('twitterAPIKey'),
          consumer_secret: config.get('twitterAPISecret')
        },
        json: true
      }
      let userProfile = await doRequest(userRequest)

      userProfile[0].verified = true
      return successResponse({ profile: userProfile })
    } else return errorResponseBadRequest('Please enter a valid handle as a query param')
  }))

  /**
   * After the user finishes onboarding in the client app and has a blockchain userId, we need to associate
   * the blockchainUserId with the twitter profile so we can write the verified flag on chain
   */
  app.post('/twitter/associate', handleResponse(async (req, res, next) => {
    let { uuid, userId, handle } = req.body
    const audiusLibsInstance = req.app.get('audiusLibs')

    try {
      let twitterObj = await models.TwitterUser.findOne({ where: { uuid: uuid } })

      // only set blockchainUserId if not already set
      if (twitterObj && !twitterObj.blockchainUserId) {
        twitterObj.blockchainUserId = userId

        // if the user is verified, write to chain, otherwise skip to next step
        if (twitterObj.verified) {
          const [encodedABI, contractAddress] = await audiusLibsInstance.User.updateIsVerified(
            userId, true, config.get('userVerifierPrivateKey')
          )
          const contractRegKey = await audiusLibsInstance.contracts.getRegistryContractForAddress(contractAddress)
          const senderAddress = config.get('userVerifierPublicKey')

          try {
            var txProps = {
              contractRegistryKey: contractRegKey,
              contractAddress: contractAddress,
              encodedABI: encodedABI,
              senderAddress: senderAddress,
              gasLimit: null
            }
            await txRelay.sendTransaction(req, false, txProps, 'twitterVerified')
          } catch (e) {
            return errorResponseBadRequest(e)
          }
        }

        const socialHandle = await models.SocialHandles.findOne({ where: { handle } })
        if (socialHandle) {
          socialHandle.twitterHandle = twitterObj.twitterProfile.screen_name
          await socialHandle.save()
        } else if (twitterObj.twitterProfile && twitterObj.twitterProfile.screen_name) {
          await models.SocialHandles.create({
            handle,
            twitterHandle: twitterObj.twitterProfile.screen_name
          })
        }

        // the final step is to save userId to db and respond to request
        try {
          await twitterObj.save()
          return successResponse()
        } catch (e) {
          return errorResponseBadRequest(e)
        }
      } else {
        req.logger.error('Twitter profile does not exist or userId has already been set', twitterObj)
        return errorResponseBadRequest('Twitter profile does not exist or userId has already been set')
      }
    } catch (err) {
      return errorResponseBadRequest(err)
    }
  }))
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
