const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const models = require('../models')
const audiusLibsWrapper = require('../audiusLibsInstance')

module.exports = function (app) {
  app.get(
    '/social_handles',
    handleResponse(async (req, res, next) => {
      const { handle } = req.query
      if (!handle) return errorResponseBadRequest('Please provide handle')

      const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
      const dnUsers = await discoveryProvider.getUsers(
        1 /* limit */,
        0 /* offset */,
        null /* user ids */,
        null /* user wallets */,
        handle /* handle */
      )
      const user = dnUsers[0]
      if (user) {
        return successResponse({
          twitterHandle: user.twitter_handle,
          instagramHandle: user.instagram_handle,
          tiktokHandle: user.tiktok_handle,
          twitterVerified: user.verified_with_twitter,
          instagramVerified: user.verified_with_instagram,
          tikTokVerified: user.verified_with_tiktok,
          website: user.website,
          donation: user.donation
        })
      } else return successResponse()
    })
  )

  app.post(
    '/social_handles',
    authMiddleware,
    handleResponse(async (req, res, next) => {
      let { twitterHandle, instagramHandle, tikTokHandle, website, donation } =
        req.body
      const handle = req.user.handle
      const socialHandles = await models.SocialHandles.findOne({
        where: { handle }
      })

      // If twitterUser is verified, audiusHandle must match twitterHandle.
      const twitterUser = await models.TwitterUser.findOne({
        where: {
          'twitterProfile.screen_name': twitterHandle,
          verified: true
        }
      })
      if (twitterUser) {
        twitterHandle = handle
      }

      if (socialHandles) {
        await socialHandles.update({
          handle,
          twitterHandle,
          instagramHandle,
          tikTokHandle,
          website,
          donation
        })
      } else {
        await models.SocialHandles.create({
          handle,
          twitterHandle,
          instagramHandle,
          tikTokHandle,
          website,
          donation
        })
      }
      return successResponse()
    })
  )
}
