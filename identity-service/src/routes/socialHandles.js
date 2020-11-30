const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

module.exports = function (app) {
  app.get('/social_handles', handleResponse(async (req, res, next) => {
    const { handle } = req.query
    if (!handle) return errorResponseBadRequest('Please provide handle')

    const socialHandles = await models.SocialHandles.findOne({
      where: { handle }
    })

    const twitterUser = await models.TwitterUser.findOne({ where: {
      'twitterProfile.screen_name': handle,
      verified: true
    } })

    const instagramUser = await models.InstagramUser.findOne({ where: {
      'profile.username': handle,
      verified: true
    } })

    if (socialHandles) {
      return successResponse({
        ...socialHandles.dataValues,
        twitterVerified: !!twitterUser,
        instagramVerified: !!instagramUser
      })
    } else return successResponse()
  }))

  app.post('/social_handles', handleResponse(async (req, res, next) => {
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
  }))
}
