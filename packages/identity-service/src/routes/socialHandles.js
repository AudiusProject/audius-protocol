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

      const socialHandles = await models.SocialHandles.findOne({
        where: { handle }
      })

      const twitterUser = await models.TwitterUser.findOne({
        where: {
          // Twitter stores case sensitive screen names
          'twitterProfile.screen_name': handle,
          verified: true
        }
      })

      const instagramUser = await models.InstagramUser.findOne({
        where: {
          // Instagram does not store case sensitive screen names
          'profile.username': handle.toLowerCase(),
          verified: true
        }
      })

      const tikTokUser = await models.TikTokUser.findOne({
        where: {
          // TikTok does not store case sensitive screen names
          'profile.display_name': handle.toLowerCase(),
          verified: true
        }
      })

      const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()
      const dnUsers = await discoveryProvider.getUsers(
        1 /* limit */,
        0 /* offset */,
        null /* user ids */,
        null /* user wallets */,
        handle /* handle */
      )
      const user = dnUsers[0]

      // Normally this would only use DN to get the socials, but for now we need to check the
      // identity table in case old clients are still updating socials only on identity and not DN.
      if (user || socialHandles) {
        const twitterHandle =
          user?.twitter_handle ?? socialHandles?.twitterHandle ?? null
        const instagramHandle =
          user?.instagram_handle ?? socialHandles?.instagramHandle ?? null
        const tikTokHandle =
          user?.tiktok_handle ?? socialHandles?.tikTokHandle ?? null
        const twitterVerified = user?.verified_with_twitter || !!twitterUser
        const instagramVerified =
          user?.verified_with_instagram || !!instagramUser
        const tikTokVerified = user?.verified_with_tiktok || !!tikTokUser
        const website = user?.website ?? socialHandles?.website ?? null
        const donation = user?.donation ?? socialHandles?.donation ?? null

        return successResponse({
          twitterHandle,
          instagramHandle,
          tikTokHandle,
          twitterVerified,
          instagramVerified,
          tikTokVerified,
          website,
          donation
        })
      }

      return successResponse()
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
