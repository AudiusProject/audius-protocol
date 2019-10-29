const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

const NotificationType = Object.freeze({
  Follow: 'Follow',
  FavoriteTrack: 'FavoriteTrack',
  FavoritePlaylist: 'FavoritePlaylist',
  FavoriteAlbum: 'FavoriteAlbum',
  RepostTrack: 'RepostTrack',
  RepostPlaylist: 'RepostPlaylist',
  RepostAlbum: 'RepostAlbum',
  Follow: 'Follow',
  Follow: 'Follow'
})

const Entity = Object.freeze({
  Track: 'Track',
  Playlist: 'Playlist',
  Album: 'Album',
  User: 'User'
})

const processUserSubscriptionCollection = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityOwnerId: notification.actions[0].actionEntityId,
    entityIds: [notification.entityId],
    userId: notification.entityId,
    type: 'userSubscription'
  }
}

const processUserSubscriptionTrack = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityOwnerId: notification.entityId,
    entityIds: notification.actions.map(action => action.actionEntityId),
    userId: notification.entityId,
    type: 'userSubscription'
  }
}

const processFavorite = (entityType) => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    type: 'favorite',
    entityType,
    entityId: notification.entityId,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const processRepost = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityId: notification.entityId,
    type: 'repost',
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const processFollow = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    type: notification.type.toLowerCase(),
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const getCommonNotificationsFields = (notification) => ({
  id: notification.id,
  isHidden: notification.isHidden,
  idRead: notification.idRead,
  timestamp: notification.timestamp
})

const notificationResponseMap = {
  [NotificationType.Follow]: processFollow,
  [NotificationType.FavoriteTrack]: processFavorite(Entity.Track),
  [NotificationType.FavoritePlaylist]: processFavorite(Entity.Playlist),
  [NotificationType.FavoriteAlbum]: processFavorite(Entity.Album),
  [NotificationType.RepostTrack]: processRepost(Entity.Track),
  [NotificationType.RepostPlaylist]: processRepost(Entity.Playlist),
  [NotificationType.RepostAlbum]: processRepost(Entity.Album)

}

const processNotifications = (notifications) =>
  notifications.map((notification) => {
    if (!notification.actions) return null
    const mapResponse = notificationResponseMap[notification.type]
    if (mapResponse) return mapResponse(notification)
  }).filter(Boolean)

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
      // const userNotifications = processNotifications(notifications)
      // return successResponse({ message: 'success', notifications: userNotifications })
      return successResponse({ message: 'success', notifications })
    } catch (err) {
      console.log(err)
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notifications for user: ${userId}`
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
