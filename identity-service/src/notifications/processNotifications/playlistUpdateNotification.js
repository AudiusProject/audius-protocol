const moment = require('moment-timezone')
const models = require('../../models')

/**
 * Process playlist update notifications
 * upsert lastUpdated and userLastViewed in the DB for each subscriber of a playlist
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processPlaylistUpdateNotifications (notifications, tx) {
  /**
     * keep track of last playlist updates for each user that favorited playlists
     * e.g. { user1: { playlist1: <timestamp1>, playlist2: <timestamp2>, ... }, ... }
     */

  const userPlaylistUpdatesMap = {}
  notifications.forEach(notification => {
    const { metadata } = notification
    const {
      entity_id: playlistId,
      playlist_update_timestamp: playlistUpdatedAt,
      playlist_update_users: userIds
    } = metadata
    userIds.forEach(userId => {
      if (userPlaylistUpdatesMap[userId]) {
        userPlaylistUpdatesMap[userId][playlistId] = playlistUpdatedAt
      } else {
        userPlaylistUpdatesMap[userId] = { [playlistId]: playlistUpdatedAt }
      }
    })
  })

  const userIds = Object.keys(userPlaylistUpdatesMap)

  // get wallets for all user ids and map each user id to their wallet
  const userIdsAndWallets = await models.User.findAll({
    attributes: ['id', 'walletAddress'],
    where: {
      id: userIds,
      walletAddress: { [models.Sequelize.Op.ne]: null }
    },
    raw: true,
    transaction: tx
  })
  const userWallets = []
  const userIdToWalletsMap = userIdsAndWallets.reduce((accumulator, current) => {
    const walletAddress = current.walletAddress
    userWallets.push(current.walletAddress)
    return {
      ...accumulator,
      [current.id]: walletAddress
    }
  }, {})

  // get playlist updates for all wallets and map each wallet to its playlist updates
  const userWalletsAndPlaylistUpdates = await models.UserEvents.findAll({
    attributes: ['walletAddress', 'playlistUpdates'],
    where: {
      walletAddress: userWallets
    },
    raw: true,
    transaction: tx
  })
  const userWalletToPlaylistUpdatesMap = userWalletsAndPlaylistUpdates.reduce((accumulator, current) => {
    return {
      ...accumulator,
      [current.walletAddress]: current.playlistUpdates
    }
  }, {})

  const now = moment().utc().valueOf()

  const newPlaylistUpdatePromises = userIds.map(userId => {
    const walletAddress = userIdToWalletsMap[userId]
    if (!walletAddress) return Promise.resolve()

    const dbPlaylistUpdates = userWalletToPlaylistUpdatesMap[walletAddress] || {}
    const fetchedPlaylistUpdates = userPlaylistUpdatesMap[userId]
    Object.keys(fetchedPlaylistUpdates).forEach(playlistLibraryItemId => {
      const fetchedLastUpdated = moment(fetchedPlaylistUpdates[playlistLibraryItemId]).utc().valueOf()
      dbPlaylistUpdates[playlistLibraryItemId] = {
        userLastViewed: now, // will this work for auto-favorited playlists e.g. on signup?
        ...dbPlaylistUpdates[playlistLibraryItemId],
        lastUpdated: fetchedLastUpdated
      }
    })

    // upsert playlist updates based for the wallet address
    return models.UserEvents.upsert({
      walletAddress,
      playlistUpdates: dbPlaylistUpdates
    })
  })

  await Promise.all(newPlaylistUpdatePromises)
}

module.exports = processPlaylistUpdateNotifications
