const moment = require('moment')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')
const models = require('../models')
const authMiddleware = require('../authMiddleware')
const { fetchAnnouncements } = require('../announcements.js')

const NotificationType = Object.freeze({
  Follow: 'Follow',
  Repost: 'Repost',
  Favorite: 'Favorite',
  FavoriteTrack: 'FavoriteTrack',
  FavoritePlaylist: 'FavoritePlaylist',
  FavoriteAlbum: 'FavoriteAlbum',
  RepostTrack: 'RepostTrack',
  RepostPlaylist: 'RepostPlaylist',
  RepostAlbum: 'RepostAlbum',
  CreateTrack: 'CreateTrack',
  CreateAlbum: 'CreateAlbum',
  CreatePlaylist: 'CreatePlaylist',
  Announcement: 'Announcement',
  UserSubscription: 'UserSubscription',
  Milestone: 'Milestone',
  MilestoneRepost: 'MilestoneRepost',
  MilestoneFavorite: 'MilestoneFavorite',
  MilestoneListen: 'MilestoneListen',
  MilestoneFollow: 'MilestoneFollow',
  RemixCreate: 'RemixCreate',
  RemixCosign: 'RemixCosign',
  TrendingTrack: 'TrendingTrack'
})

const ClientNotificationTypes = new Set([
  NotificationType.Follow,
  NotificationType.Repost,
  NotificationType.Favorite,
  NotificationType.Announcement,
  NotificationType.UserSubscription,
  NotificationType.Milestone,
  NotificationType.TrendingTrack
])

const Entity = Object.freeze({
  Track: 'Track',
  Playlist: 'Playlist',
  Album: 'Album',
  User: 'User'
})

const Achievement = Object.freeze({
  Listens: 'Listens',
  Reposts: 'Reposts',
  Favorite: 'Favorites',
  Trending: 'Trending',
  Plays: 'Plays',
  Followers: 'Followers'
})

const formatUserSubscriptionCollection = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityOwnerId: notification.actions[0].actionEntityId,
    entityIds: [notification.entityId],
    userId: notification.actions[0].actionEntityId,
    type: NotificationType.UserSubscription
  }
}

const formatUserSubscriptionTrack = notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType: Entity.Track,
    entityOwnerId: notification.entityId,
    entityIds: notification.actions.map(action => action.actionEntityId),
    userId: notification.entityId,
    type: NotificationType.UserSubscription
  }
}

const formatFavorite = (entityType) => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.Favorite,
    entityType,
    entityId: notification.entityId,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatRepost = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityId: notification.entityId,
    type: NotificationType.Repost,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatFollow = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.Follow,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatAnnouncement = (notification, announcements) => {
  const announcementIdx = announcements.findIndex(a => a.entityId === notification.entityId)
  if (announcementIdx === -1) return null
  const announcement = announcements[announcementIdx]
  return {
    ...getCommonNotificationsFields(notification),
    ...announcement,
    id: announcement.entityId,
    timestamp: announcement.datePublished,
    type: NotificationType.Announcement
  }
}

const formatUnreadAnnouncement = (announcement) => {
  return {
    ...announcement,
    id: announcement.entityId,
    isHidden: false,
    isRead: false,
    timestamp: announcement.datePublished,
    type: NotificationType.Announcement
  }
}

const mapMilestone = {
  [NotificationType.MilestoneRepost]: {
    achievement: Achievement.Reposts
  },
  [NotificationType.MilestoneFavorite]: {
    achievement: Achievement.Favorite
  },
  [NotificationType.MilestoneListen]: {
    achievement: Achievement.Listens
  },
  [NotificationType.MilestoneFollow]: {
    achievement: Achievement.Followers
  }
}

const formatMilestone = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    ...mapMilestone[notification.type],
    type: NotificationType.Milestone,
    entityType: notification.actions[0].actionEntityType,
    entityId: notification.entityId,
    value: notification.actions[0].actionEntityId
  }
}

const formatRemixCreate = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.RemixCreate,
    parentTrackId: notification.actions[0].actionEntityId,
    childTrackId: notification.entityId
  }
}

const formatRemixCosign = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.RemixCosign,
    parentTrackUserId: notification.actions[0].actionEntityId,
    childTrackId: notification.entityId
  }
}

const formatTrendingTrack = (notification) => {
  const [time, genre] = notification.actions[0].actionEntityType.split(':')
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.TrendingTrack,
    entityType: Entity.Track,
    entityId: notification.entityId,
    rank: notification.actions[0].actionEntityId,
    time,
    genre
  }
}

const getCommonNotificationsFields = (notification) => ({
  id: notification.id,
  isHidden: notification.isHidden,
  isRead: notification.isRead,
  isViewed: notification.isViewed,
  timestamp: notification.timestamp
})

const notificationResponseMap = {
  [NotificationType.Follow]: formatFollow,
  [NotificationType.FavoriteTrack]: formatFavorite(Entity.Track),
  [NotificationType.FavoritePlaylist]: formatFavorite(Entity.Playlist),
  [NotificationType.FavoriteAlbum]: formatFavorite(Entity.Album),
  [NotificationType.RepostTrack]: formatRepost(Entity.Track),
  [NotificationType.RepostPlaylist]: formatRepost(Entity.Playlist),
  [NotificationType.RepostAlbum]: formatRepost(Entity.Album),
  [NotificationType.CreateTrack]: formatUserSubscriptionTrack,
  [NotificationType.CreateAlbum]: formatUserSubscriptionCollection(Entity.Album),
  [NotificationType.CreatePlaylist]: formatUserSubscriptionCollection(Entity.Playlist),
  [NotificationType.Announcement]: formatAnnouncement,
  [NotificationType.MilestoneRepost]: formatMilestone,
  [NotificationType.MilestoneFavorite]: formatMilestone,
  [NotificationType.MilestoneListen]: formatMilestone,
  [NotificationType.MilestoneFollow]: formatMilestone,
  [NotificationType.RemixCreate]: formatRemixCreate,
  [NotificationType.RemixCosign]: formatRemixCosign,
  [NotificationType.TrendingTrack]: formatTrendingTrack
}

/* Merges the notifications with the user announcements in time sorted order (Most recent first).
 *
 * @param {Array<Notification>} notifications   Notifications return from the db query w/ the actions
 * @param {Array<Announcement>} announcements   Announcements set on the app
 *
 * @return {Array<Notification|Announcement>} The merged & nsorted notificaitons/annoucnements
 */
function mergeAudiusAnnoucements (announcements, notifications) {
  const allNotifications = announcements.concat(notifications)
  allNotifications.sort((a, b) => {
    let aDate = moment(a.datePublished || a.timestamp)
    let bDate = moment(b.datePublished || b.timestamp)
    return bDate - aDate
  })
  return allNotifications
}

/* Merges the notifications with the user announcements in time sorted order.
 * Formats each notification to be send to the client.
 * Counts the total number of unread notifications
 *
 * @param {Array<Notification>} notifications   Notifications return from the db query w/ the actions
 * @param {Array<Announcement>} announcements   Announcements set on the app
 *
 * @return {object} The sorted & formated notificaitons/annoucnements and the total unread count for notifs & announcements
 */
const formatNotifications = (notifications, announcements) => {
  const userAnnouncements = [...announcements]
  const userNotifications = notifications.map((notification) => {
    const mapResponse = notificationResponseMap[notification.type]
    if (mapResponse) return mapResponse(notification, userAnnouncements)
  }).filter(Boolean)

  const notifIds = userNotifications.reduce((acc, notif) => {
    acc[notif.id] = true
    return acc
  }, {})

  const unreadAnnouncements = userAnnouncements
    .filter(a => !notifIds[a.entityId])
    .map(formatUnreadAnnouncement)

  return mergeAudiusAnnoucements(unreadAnnouncements, userNotifications)
}

/**
 * Clear badge counts for a given user
 * @param {Integer} userId
 * @param {Object} logger
 */
async function clearBadgeCounts (userId, logger) {
  try {
    await models.PushNotificationBadgeCounts.update(
      {
        iosBadgeCount: 0
      },
      {
        where: {
          userId
        }
      }
    )
  } catch (e) {
    logger.error(`Failed to clear badge counts for user ${userId}`)
  }
}

module.exports = function (app) {
  /*
   * Fetches the notifications for the specified userId
   * urlQueryParam: {number} limit        Max number of notifications to return, Cannot exceed 100
   * urlQueryParam: {number?} timeOffset  A timestamp reference offset for fetch notification before this date
   * urlQueryParam: {boolean?} withRemix  A boolean to fetch notifications with remixes
   * urlQueryParam: {boolean?} withTrendingTrack  A boolean to fetch notifications with weekly trending tracks
   *
   * TODO: Validate userId
   * NOTE: The `createdDate` param can/should be changed to the user sending their wallet &
   * finding the created date from the users table
  */
  app.get('/notifications', authMiddleware, handleResponse(async (req) => {
    const limit = parseInt(req.query.limit)
    const timeOffset = req.query.timeOffset ? moment(req.query.timeOffset) : moment()
    const { blockchainUserId: userId, createdAt } = req.user
    const createdDate = moment(createdAt)
    if (!timeOffset.isValid()) {
      return errorResponseBadRequest(`Invalid Date params`)
    }

    const filterNotificationTypes = []

    if (req.query.withRemix !== 'true') {
      filterNotificationTypes.push(NotificationType.RemixCreate, NotificationType.RemixCosign)
    }

    if (req.query.withTrendingTrack !== 'true') {
      filterNotificationTypes.push(NotificationType.TrendingTrack)
    }

    const queryFilter = filterNotificationTypes.length > 0 ? {
      type: { [models.Sequelize.Op.notIn]: filterNotificationTypes }
    } : {}
    req.logger.warn({ filterNotificationTypes })
    if (isNaN(limit) || limit > 100) {
      return errorResponseBadRequest(
        `Limit and offset number be integers with a max limit of 100`
      )
    }
    try {
      const notifications = await models.Notification.findAll({
        where: {
          userId,
          isHidden: false,
          ...queryFilter,
          timestamp: {
            [models.Sequelize.Op.lt]: timeOffset.toDate()
          }
        },
        order: [
          ['timestamp', 'DESC'],
          ['entityId', 'ASC']
        ],
        include: [{
          model: models.NotificationAction,
          required: true,
          as: 'actions'
        }],
        limit
      })
      let unViewedCount = await models.Notification.findAll({
        where: {
          userId,
          isViewed: false,
          isRead: false,
          isHidden: false,
          ...queryFilter
        },
        include: [{ model: models.NotificationAction, as: 'actions', required: true, attributes: [] }],
        attributes: [[models.Sequelize.fn('COUNT', models.Sequelize.col('Notification.id')), 'total']],
        group: ['Notification.id']
      })
      unViewedCount = unViewedCount.length

      const viewedAnnouncements = await models.Notification.findAll({
        where: { userId, isViewed: true, type: NotificationType.Announcement }
      })
      const viewedAnnouncementCount = viewedAnnouncements.length

      const filteredViewedAnnouncements = viewedAnnouncements
        .filter(a => moment(a.createdAt).isAfter(createdDate))
        .filter(a => timeOffset.isAfter(moment(a.createdAt)))

      const announcements = app.get('announcements')
      const validUserAnnouncements = announcements
        .filter(a => moment(a.datePublished).isAfter(createdDate))
      const announcementsAfterFilter = validUserAnnouncements
        .filter(a => timeOffset.isAfter(moment(a.datePublished)))

      const unreadAnnouncementCount = validUserAnnouncements.length - viewedAnnouncementCount
      const userNotifications = formatNotifications(
        notifications.concat(filteredViewedAnnouncements),
        announcementsAfterFilter
      )

      let playlistUpdates = []
      const user = await models.User.findOne({
        attributes: ['walletAddress'],
        where: { id: userId }
      })
      const walletAddress = user && user.walletAddress
      if (walletAddress) {
        const result = await models.UserEvents.findOne({
          attributes: ['playlistUpdates'],
          where: { walletAddress }
        })
        const playlistUpdatesResult = result && result.playlistUpdates
        if (playlistUpdatesResult) {
          const thirtyDaysAgo = moment().utc().subtract(30, 'days').valueOf()
          playlistUpdates = Object.keys(playlistUpdatesResult)
            .filter(playlistId =>
              playlistUpdatesResult[playlistId].userLastViewed >= thirtyDaysAgo &&
              playlistUpdatesResult[playlistId].lastUpdated >= thirtyDaysAgo &&
              playlistUpdatesResult[playlistId].userLastViewed < playlistUpdatesResult[playlistId].lastUpdated
            )
            .map(id => parseInt(id))
            .filter(Boolean)
        }
      }

      return successResponse({
        message: 'success',
        notifications: userNotifications.slice(0, limit),
        totalUnread: unreadAnnouncementCount + unViewedCount,
        playlistUpdates
      })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notifications for user: ${userId}`
      })
    }
  }))

  /*
   * Sets a user's notifcation as read or hidden
   * postBody: {number?} notificationType The type of the notification to be marked as read (Only used for Announcements)
   * postBody: {number?} notificationID   The id of the notification to be marked as read (Only used for Announcements)
   * postBody: {number} isRead            Identitifies if the notification is to be marked as read
   * postBody: {number} isHidden          Identitifies if the notification is to be marked as hidden
   *
   * TODO: Validate userId
  */
  app.post('/notifications', authMiddleware, handleResponse(async (req, res, next) => {
    let { notificationId, notificationType, isRead, isHidden } = req.body
    const userId = req.user.blockchainUserId

    if (typeof notificationType !== 'string' ||
      !ClientNotificationTypes.has(notificationType) ||
      (typeof isRead !== 'boolean' && typeof isHidden !== 'boolean')) {
      return errorResponseBadRequest('Invalid request body')
    }
    try {
      if (notificationType === NotificationType.Announcement) {
        const announcementMap = app.get('announcementMap')
        const announcement = announcementMap[notificationId]
        if (!announcement) return errorResponseBadRequest('[Error] Invalid notification id')
        const [notification, isCreated] = await models.Notification.findOrCreate({
          where: {
            type: notificationType,
            userId,
            entityId: announcement.entityId
          },
          defaults: {
            isViewed: true,
            isRead: true,
            isHidden,
            blocknumber: 0,
            timestamp: announcement.datePublished
          }
        })
        if (!isCreated && (notification.isRead !== isRead || notification.isHidden !== isHidden)) {
          await notification.update({
            isViewed: true,
            ...(typeof isRead === 'boolean' ? { isRead } : {}),
            ...(typeof isHidden === 'boolean' ? { isHidden } : {})
          })
        }
        return successResponse({ message: 'success' })
      } else {
        const update = { isViewed: true, isRead: true }
        if (isHidden !== undefined) update['isHidden'] = isHidden
        await models.Notification.update(
          update,
          { where: { id: notificationId } }
        )
        return successResponse({ message: 'success' })
      }
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to mark notification as read/hidden`
      })
    }
  }))

  /*
   * Marks all of a user's notifications as viewed & optionally is read & inserts rows for announcements
   * postBody: {bool?} isRead          Identitifies if the notification is to be marked as read
   *
  */
  app.post('/notifications/all', authMiddleware, handleResponse(async (req, res, next) => {
    let { isRead, isViewed, clearBadges } = req.body
    const { createdAt, blockchainUserId: userId } = req.user

    const createdDate = moment(createdAt)
    if (!createdDate.isValid() || (typeof isRead !== 'boolean' && typeof isViewed !== 'boolean')) {
      return errorResponseBadRequest('Invalid request body')
    }
    try {
      const update = {
        isViewed: true,
        ...(typeof isRead !== 'undefined' ? { isRead } : {})
      }

      await models.Notification.update(
        update,
        { where: { userId } }
      )

      const announcementMap = app.get('announcementMap')
      const unreadAnnouncementIds = Object.keys(announcementMap).reduce((acc, id) => {
        if (moment(announcementMap[id].datePublished).isAfter(createdDate)) acc[id] = false
        return acc
      }, {})
      const readAnnouncementIds = await models.Notification.findAll({
        where: {
          type: NotificationType.Announcement,
          userId
        },
        attributes: ['entityId']
      })
      for (let announcementId of readAnnouncementIds) {
        delete unreadAnnouncementIds[announcementId.entityId]
      }
      const unreadAnnouncements = Object.keys(unreadAnnouncementIds).map(id => announcementMap[id])
      await models.Notification.bulkCreate(
        unreadAnnouncements.map(announcement => ({
          type: NotificationType.Announcement,
          entityId: announcement.entityId,
          ...update,
          isHidden: false,
          userId,
          blocknumber: 0,
          timestamp: announcement.datePublished
        }))
      )

      if (clearBadges) {
        await clearBadgeCounts(userId, req.logger)
      }
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to mark notification as read/hidden`
      })
    }
  }))

  /*
   * Clears a user's notification badge count to 0
  */
  app.post('/notifications/clear_badges', authMiddleware, handleResponse(async (req, res, next) => {
    const { blockchainUserId: userId } = req.user

    try {
      await clearBadgeCounts(userId, req.logger)
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to clear user badges for userID: ${userId}`
      })
    }
  }))

  /**
   * @deprecated
   * Updates fields for a user's settings (or creates the settings w/ db defaults if not created)
   * postBody: {object} settings      Identitifies if the notification is to be marked as read
   *
  */
  app.post('/notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const { settings } = req.body
    if (typeof settings === 'undefined') {
      return errorResponseBadRequest('Invalid request body')
    }

    try {
      await models.UserNotificationSettings.upsert({
        userId: req.user.blockchainUserId,
        ...settings
      })
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to create/update notification settings for user: ${req.user.blockchainUserId}`
      })
    }
  }))

  /**
   * @deprecated
   * Fetches the settings for a given userId
  */
  app.get('/notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId
    try {
      const [settings] = await models.UserNotificationSettings.findOrCreate({
        where: { userId },
        attributes: [
          'favorites',
          'reposts',
          'milestonesAndAchievements',
          'announcements',
          'followers',
          'browserPushNotifications',
          'emailFrequency'
        ]
      })
      return successResponse({ settings })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notification settings for user: ${userId}`
      })
    }
  }))

  /*
   * Refreshes the announcements stored in the application
  */
  app.post('/announcements', handleResponse(async (req, res, next) => {
    try {
      let { announcements, announcementMap } = await fetchAnnouncements()
      app.set('announcements', announcements)
      app.set('announcementMap', announcementMap)
      return successResponse({ msg: 'Updated announcements' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `Failed to update announcements - ${err}`
      })
    }
  }))

  /*
   * Sets or removes a user subscription
   * postBody: {number} userId          The user ID of the subscribed to user
   * postBody: {boolean} isSubscribed   If the user is subscribing or unsubscribing
   *
   * TODO: Validate that the userId is a valid userID
  */
  app.post('/notifications/subscription', authMiddleware, handleResponse(async (req, res, next) => {
    let { userId, isSubscribed } = req.body
    const subscriberId = req.user.blockchainUserId

    if (typeof userId !== 'number' ||
      typeof subscriberId !== 'number' ||
      userId === subscriberId
    ) {
      return errorResponseBadRequest('Invalid request body')
    }
    if (isSubscribed) {
      await models.Subscription.findOrCreate({
        where: { subscriberId, userId }
      })
    } else {
      await models.Subscription.destroy({
        where: { subscriberId, userId }
      })
    }
    return successResponse({ message: 'success' })
  }))

  /*
   * Returns if a user subscription exists
   * urlQueryParam: {Array<number>} userId       The user ID(s) of the subscribed to user
  */
  app.get('/notifications/subscription', authMiddleware, handleResponse(async (req, res, next) => {
    const usersIdsParam = Array.isArray(req.query.userId)
      ? req.query.userId.map(id => parseInt(id))
      : [parseInt(req.query.userId)]
    const usersIds = usersIdsParam.filter(id => !isNaN(id))
    if (usersIds.length === 0) return errorResponseBadRequest('Invalid request parameters')
    const subscriptions = await models.Subscription.findAll({
      where: {
        subscriberId: req.user.blockchainUserId,
        userId: {
          [models.Sequelize.Op.in]: usersIds
        }
      }
    })
    const initSubscribers = usersIds.reduce((acc, id) => {
      acc[id] = { isSubscribed: false }
      return acc
    }, {})
    const users = subscriptions.reduce((subscribers, subscription) => {
      subscribers[subscription.userId] = { isSubscribed: true }
      return subscribers
    }, initSubscribers)
    return successResponse({ users })
  }))
}

module.exports.mergeAudiusAnnoucements = mergeAudiusAnnoucements
module.exports.mapMilestone = mapMilestone
module.exports.NotificationType = NotificationType
module.exports.Entity = Entity
