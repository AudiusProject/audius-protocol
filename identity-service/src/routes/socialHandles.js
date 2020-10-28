const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')
const { getRateLimiter } = require('../rateLimiter')

const socialHandlesRateLimiter = getRateLimiter({
  prefix: 'socialHandlesRateLimiter:'
})

module.exports = function (app) {
  app.get('/social_handles', handleResponse(async (req, res, next) => {
    const handle = req.query.handle
    if (!handle) return errorResponseBadRequest('Please provide handle')

    const socialHandles = await models.SocialHandles.findOne({
      where: { handle }
    })

    if (socialHandles) {
      return successResponse(socialHandles)
    } else return successResponse()
  }))

  app.post(
    '/social_handles',
    socialHandlesRateLimiter,
    handleResponse(async (req, res, next) => {
      let { handle, twitterHandle, instagramHandle, website, donation } = req.body
      if (!handle) return errorResponseBadRequest('Please provide handle')

      const socialHandles = await models.SocialHandles.findOne({
        where: { handle }
      })

      // If twitterUser is verified, audiusHandle must match twitterHandle.
      const twitterUser = await models.TwitterUser.findOne({ where: {
        'twitterProfile.screen_name': twitterHandle,
        verified: true
      } })
      if (twitterUser) { handle = twitterHandle }

      if (socialHandles) {
        await socialHandles.update({
          handle,
          twitterHandle,
          instagramHandle,
          website,
          donation
        })
      } else {
        await models.SocialHandles.create({
          handle,
          twitterHandle,
          instagramHandle,
          website,
          donation
        })
      }
      return successResponse()
    })
  )
}
