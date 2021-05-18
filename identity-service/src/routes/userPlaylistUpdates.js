const moment = require('moment-timezone')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const models = require('../models')
const authMiddleware = require('../authMiddleware')

module.exports = function (app) {
  // maybe we don't need this endpoint
  /**
   * Updates the lastPlaylistViews field for the user in the UserEvents table
   * @param {string} walletAddress   user wallet address
   */
  app.get('/user_playlist_updates', handleResponse(async (req) => {
    const { walletAddress } = req.query
    if (!walletAddress) {
      return errorResponseBadRequest('Please provide a wallet address')
    }

    try {
      const userEvents = await models.UserEvents.findOne({
        attributes: ['playlistUpdates'],
        where: { walletAddress },
        raw: true
      })
      if (!userEvents) throw new Error(`UserEvents for ${walletAddress} not found`)

      return successResponse(userEvents.playlistUpdates)
    } catch (e) {
      req.logger.error(e)
      // no-op. No user events.
      return errorResponseServerError(
        `Unable to get user last playlist views for ${walletAddress}`
      )
    }
  }))

  /**
   * Updates the lastPlaylistViews field for the user in the UserEvents table
   * @param {string} walletAddress            user wallet address
   * @param {boolean} playlistLibraryItemId   id of playlist or folder to update
   */
  app.post('/user_playlist_updates', authMiddleware, handleResponse(async (req) => {
    const { walletAddress, playlistLibraryItemId } = req.query
    if (!walletAddress || !playlistLibraryItemId) {
      return errorResponseBadRequest(
        'Please provide a wallet address and a playlist library item id'
      )
    }

    try {
      let playlistUpdatesResult = await models.UserEvents.findOne({
        attributes: ['playlistUpdates'],
        where: { walletAddress },
        raw: true
      })
      if (!playlistUpdatesResult) throw new Error(`Playlist updates for ${walletAddress} not found`)

      playlistUpdatesResult = playlistUpdatesResult.playlistUpdates

      const now = moment().utc().valueOf()
      let playlistUpdates = {}
      if (!playlistUpdatesResult) {
        playlistUpdates[playlistLibraryItemId] = {
          lastUpdated: now,
          userLastViewed: now
        }
      } else {
        playlistUpdates = {
          ...playlistUpdatesResult,
          [playlistLibraryItemId]: {
            lastUpdated: now,
            ...playlistUpdatesResult[playlistLibraryItemId],
            userLastViewed: now
          }
        }
      }

      await models.UserEvents.update(
        { playlistUpdates },
        { where: { walletAddress } }
      )
      return successResponse({})
    } catch (e) {
      req.logger.error(e)
      console.log(e)
      return errorResponseServerError(
        `Unable to update user last playlist views for ${walletAddress} for playlist library item id ${playlistLibraryItemId}`
      )
    }
  }))
}
