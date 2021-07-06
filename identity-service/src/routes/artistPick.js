const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const Sequelize = require('sequelize')
const models = require('../models')
const authMiddleware = require('../authMiddleware')

module.exports = function (app) {
  app.post('/artist_pick', authMiddleware, handleResponse(async (req, res, next) => {
    const handle = req.user.handle
    const { trackId, handle } = req.body

    if (!handle) return errorResponseBadRequest('Please provide handle')

    await models.SocialHandles.upsert({
      handle,
      pinnedTrackId: trackId || null
    })
    return successResponse()
  }))

  app.get('/artist_pick', handleResponse(async (req, res, next) => {
    const { handles } = req.query
    if (!handles) return errorResponseBadRequest('Please provide handles')

    const userSocials = await models.SocialHandles.findAll({
      where: {
        handle: {
          [Sequelize.Op.in]: handles
        }
      }
    })
    return successResponse({
      artistPicks: userSocials.map(({ handle, pinnedTrackId }) => ({ handle, pinnedTrackId }))
    })
  }))
}
