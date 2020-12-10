const axios = require('axios')
const moment = require('moment')

const models = require('../models')
const { logger } = require('../logging')
const config = require('../config.js')
const {
  deviceType,
  notificationTypes
} = require('./constants')
const { publish } = require('./notificationQueue')
const {
  decodeHashId,
  shouldNotifyUser
} = require('./utils')
const { fetchNotificationMetadata } = require('./fetchNotificationMetadata')
const {
  notificationResponseMap,
  notificationResponseTitleMap,
  pushNotificationMessagesMap
} = require('./formatNotificationMetadata')

const notifDiscProv = config.get('notificationDiscoveryProvider')

const TRENDING_TIME = Object.freeze({
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'YEAR'
})

const TRENDING_GENRE = Object.freeze({
  ALL: 'all'
})

const getTimeGenreActionType = (time, genre) => `${time}:${genre}`

// The minimum time in hrs between notifications
const TRENDING_INTERVAL = 3

// The highest rank for which a notification will be sent
const MAX_TOP_TRACK_RANK = 10

async function getTrendingTracks () {
  try {
    // The owner info is then used to target listenCount milestone notifications
    let params = new URLSearchParams()
    params.append('time', TRENDING_TIME.WEEK)
    params.append('limit', MAX_TOP_TRACK_RANK)

    const trendingTracksResponse = await axios({
      method: 'get',
      url: `${notifDiscProv}/v1/full/tracks/trending?time=week`,
      params,
      timeout: 10000
    })
    const trendingTracks = trendingTracksResponse.data.data.map((track, idx) => ({
      trackId: decodeHashId(track.id),
      rank: idx + 1,
      userId: decodeHashId(track.user.id)
    }))
    const blocknumber = trendingTracksResponse.data.latest_indexed_block
    return { trendingTracks, blocknumber }
  } catch (err) {
    console.log(err)
    return null
  }
}

async function processTrendingTracks (audiusLibs, blocknumber, trendingTracks, tx) {
  const now = moment()
  for (let idx = 0; idx < trendingTracks.length; idx += 1) {
    const { rank, trackId, userId } = trendingTracks[idx]
    const { notifyMobile, notifyBrowserPush } = await shouldNotifyUser(userId, 'milestonesAndAchievements')

    // Check if the notification was previously created
    let existingTrendingTracks = await models.Notification.findAll({
      where: {
        userId: userId,
        type: notificationTypes.TrendingTrack,
        entityId: trackId
      },
      include: [{
        model: models.NotificationAction,
        as: 'actions'
      }],
      order: [['timestamp', 'DESC']],
      limit: 1,
      transaction: tx
    })
    if (existingTrendingTracks.length > 0) {
      const previousRank = existingTrendingTracks[0].actions[0].actionEntityId
      const previousCreated = moment(existingTrendingTracks[0].timestamp)
      const duration = moment.duration(now.diff(previousCreated)).asHours()
      if (duration < TRENDING_INTERVAL || previousRank <= rank) {
        // Skip the insertion of the notification into the DB
        // This trending track does not meet the constraints
        continue
      }
    }

    const actionEntityType = getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL)
    const trendingTrackNotification = await models.Notification.create({
      userId: userId,
      type: notificationTypes.TrendingTrack,
      entityId: trackId,
      blocknumber,
      timestamp: now
    }, { transaction: tx })
    const notificationId = trendingTrackNotification.id
    await models.NotificationAction.create({
      notificationId,
      actionEntityType,
      actionEntityId: rank,
      blocknumber
    },
    { transaction: tx }
    )

    if (notifyMobile || notifyBrowserPush) {
      const notifStub = {
        userId: userId,
        type: notificationTypes.TrendingTrack,
        entityId: trackId,
        blocknumber,
        timestamp: now,
        actions: [{
          actionEntityType,
          actionEntityId: rank,
          blocknumber
        }]
      }

      const metadata = await fetchNotificationMetadata(audiusLibs, [], [notifStub])
      const mapNotification = notificationResponseMap[notificationTypes.TrendingTrack]
      try {
        let msgGenNotif = {
          ...notifStub,
          ...(mapNotification(notifStub, metadata))
        }
        logger.debug('processTrendingTrack - About to generate message for trending track milestone push notification', msgGenNotif, metadata)
        const msg = pushNotificationMessagesMap[notificationTypes.TrendingTrack](msgGenNotif)
        logger.debug(`processTrendingTrack - message: ${msg}`)
        const title = notificationResponseTitleMap[notificationTypes.TrendingTrack]
        let types = []
        if (notifyMobile) types.push(deviceType.Mobile)
        if (notifyBrowserPush) types.push(deviceType.Browser)
        await publish(msg, userId, tx, true, title, types)
      } catch (e) {
        // Log on error instead of failing
        logger.info(`Error adding push notification to buffer: ${e}. notifStub ${JSON.stringify(notifStub)}`)
      }
    }
  }
}

async function indexTrendingTracks (audiusLibs, tx) {
  try {
    const { trendingTracks, blocknumber } = await getTrendingTracks()
    await processTrendingTracks(audiusLibs, blocknumber, trendingTracks, tx)
  } catch (err) {
    logger.error(`Unable to process trending track notifications: ${err.message}`)
  }
}

module.exports = {
  TRENDING_TIME,
  TRENDING_GENRE,
  getTimeGenreActionType,
  indexTrendingTracks,
  processTrendingTracks
}
