const moment = require('moment')
const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

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
  UserSubscription: 'UserSubscription'
})

const ClientNotificationTypes = new Set([
  NotificationType.Follow,
  NotificationType.Repost,
  NotificationType.Favorite,
  NotificationType.Announcement,
  NotificationType.UserSubscription
])

const Entity = Object.freeze({
  Track: 'Track',
  Playlist: 'Playlist',
  Album: 'Album',
  User: 'User'
})

const formatUserSubscriptionCollection = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityOwnerId: notification.actions[0].actionEntityId,
    entityIds: [notification.entityId],
    userId: notification.entityId,
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

const getCommonNotificationsFields = (notification) => ({
  id: notification.id,
  isHidden: notification.isHidden,
  isRead: notification.isRead,
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
  [NotificationType.Announcement]: formatAnnouncement
}

const mergeAudiusAnnoucements = (announcements, notifications) => {
  const allNotifications = announcements.concat(notifications)
  allNotifications.sort((a, b) => {
    let aDate = moment(a.datePublished || a.timestamp)
    let bDate = moment(b.datePublished || b.timestamp)
    return bDate - aDate
  })
  return allNotifications
}

const formatNotifications = (notifications, announcements) => {
  const userAnnouncements = [...announcements]
  const userNotifications = notifications.map((notification) => {
    const mapResponse = notificationResponseMap[notification.type]
    if (mapResponse) return mapResponse(notification, userAnnouncements)
  })
  const notifIds = userNotifications.reduce((acc, notif) => {
    acc[notif.id] = true
    return acc
  }, {})

  const unreadAnnouncements = userAnnouncements
    .filter(a => !notifIds[a.entityId])
    .map(formatUnreadAnnouncement)
  return mergeAudiusAnnoucements(unreadAnnouncements, userNotifications)
}

module.exports = function (app) {
  // Sets a user subscription
  app.get('/notifications', handleResponse(async (req, res, next) => {
    const userId = parseInt(req.query.userId)
    const limit = parseInt(req.query.limit)
    const offset = parseInt(req.query.offset)

    if (isNaN(userId)) {
      return errorResponseBadRequest('Invalid request body')
    }

    if (isNaN(offset) || isNaN(limit) || limit > 100) {
      return errorResponseBadRequest(
        `Limit and offset number be integers with a max limit of 100`
      )
    }

    try {
      const notifications = await models.Notification.findAll({
        where: { userId, isHidden: false },
        order: [
          ['timestamp', 'DESC'],
          ['entityId', 'ASC']
        ],
        include: [{
          model: models.NotificationAction,
          as: 'actions'
        }],
        limit,
        offset
      })
      const announcements = app.get('announcements')
      const userNotifications = formatNotifications(notifications, announcements)
      return successResponse({ message: 'success', notifications: userNotifications.slice(0, limit) })
    } catch (err) {
      console.log(err)
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notifications for user: ${userId}`
      })
    }
  }))

  // Sets a user's notifcation as read or hidden
  app.post('/notifications', handleResponse(async (req, res, next) => {
    let { userId, notificationId, notificationType, isRead, isHidden } = req.body
    if (
      typeof userId !== 'number' ||
      typeof notificationType !== 'string' ||
      !ClientNotificationTypes.has(notificationType) ||
      (typeof isRead !== 'boolean' && typeof isHidden !== 'boolean')) {
      return errorResponseBadRequest('Invalid request body')
    }
    // TODO Validate userID
    try {
      if (notificationType === NotificationType.Announcement) {
        const announcementMap = app.get('announcementMap')
        const announcement = announcementMap[notificationId]
        if (!announcement) return errorResponseBadRequest('[Error] Invalid notification id')
        await models.Notification.create({
          type: notificationType,
          entityId: announcement.entityId,
          isRead: true,
          isHidden,
          userId,
          blocknumber: 0,
          timestamp: announcement.datePublished
        })
        return successResponse({ message: 'success' })
      } else {
        await models.Notification.update(
          { isRead: true, isHidden },
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

  // Sets a user's notifcation as read or hidden
  app.post('/notifications/all', handleResponse(async (req, res, next) => {
    let { userId, isRead } = req.body
    if (typeof userId !== 'number' || typeof isRead !== 'boolean') {
      return errorResponseBadRequest('Invalid request body')
    }
    // TODO Validate userID
    try {
      if (typeof isRead === 'boolean') {
        await models.Notification.update(
          { isRead },
          { where: { userId, isRead: !isRead } }
        )

        const announcementMap = app.get('announcementMap')
        const unreadAnnouncementIds = Object.keys(announcementMap).reduce((acc, id) => {
          acc[id] = false
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
          delete unreadAnnouncementIds[announcementId]
        }
        const unreadAnnouncements = Object.keys(unreadAnnouncementIds).map(id => announcementMap[id])
        await models.Notification.bulkCreate(
          unreadAnnouncements.map(announcement => ({
            type: NotificationType.Announcement,
            entityId: announcement.entityId,
            isRead: true,
            isHidden: false,
            userId,
            blocknumber: 0,
            timestamp: announcement.datePublished
          }))
        )
      }
      return successResponse({ message: 'success' })
    } catch (err) {
      console.log(err)
      return errorResponseBadRequest({
        message: `[Error] Unable to mark notification as read/hidden`
      })
    }
  }))

  // Sets a user subscription
  app.post('/notifications/settings', handleResponse(async (req, res, next) => {
    let { userId, settings } = req.body
    if (typeof settings === 'undefined' || typeof userId !== 'number') {
      return errorResponseBadRequest('Invalid request body')
    }
    try {
      await models.UserNotificationSettings.upsert({
        userId,
        ...settings
      })
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to create/update notification settings for user: ${userId}`
      })
    }
  }))

  // Returns true if the subscriberId user subscribes to the userId
  app.get('/notifications/settings', handleResponse(async (req, res, next) => {
    // TODO: Validate that the subscriberId is coming from the user w/ their wallet
    const userId = parseInt(req.query.userId)

    if (isNaN(userId)) {
      return errorResponseBadRequest('Invalid request parameters')
    }
    try {
      const [settings] = await models.UserNotificationSettings.findOrCreate({
        where: { userId },
        attributes: [
          'favorites',
          'reposts',
          'announcements',
          'followers',
          'browserPushNotifications',
          'emailFrequency'
        ]
      })
      return successResponse({ settings })
    } catch (err) {
      console.log(err)
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notification settings for user: ${userId}`
      })
    }
  }))

  // Sets a user subscription
  app.post('/notifications/subscription', handleResponse(async (req, res, next) => {
    let { subscriberId, userId, isSubscribed } = req.body

    // TODO: Validate that the subscriberId is comoing from the user w/ their wallet
    // TODO: Validate that the userId is a valid userID

    if (typeof isSubscribed !== 'boolean' ||
      typeof userId !== 'number' ||
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

  // Returns true if the subscriberId user subscribes to the userId
  app.get('/notifications/subscription', handleResponse(async (req, res, next) => {
    // TODO: Validate that the subscriberId is coming from the user w/ their wallet
    const subscriberId = parseInt(req.query.subscriberId)
    const userId = parseInt(req.query.userId)

    if (isNaN(subscriberId) || isNaN(userId)) {
      return errorResponseBadRequest('Invalid request parameters')
    }
    const subscription = await models.Subscription.findOne({
      where: { subscriberId, userId }
    })
    return successResponse({ isSubscribed: !!subscription })
  }))
}
