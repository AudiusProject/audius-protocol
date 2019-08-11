const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

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

  app.post('/social_handles', handleResponse(async (req, res, next) => {
    const { handle, twitterHandle, instagramHandle } = req.body
    if (!handle) return errorResponseBadRequest('Please provide handle')

    const socialHandles = await models.SocialHandles.findOne({
      where: { handle }
    })

    if (socialHandles) {
      await socialHandles.update({
        handle,
        twitterHandle,
        instagramHandle
      })
    } else {
      await models.SocialHandles.create({
        handle,
        twitterHandle,
        instagramHandle
      })
    }
    return successResponse()
  }))
}
