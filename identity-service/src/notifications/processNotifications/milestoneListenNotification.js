const { logger } = require('../../logging')
const models = require('../../models')
const {
  notificationTypes,
  actionEntityTypes
} = require('../constants')

/**
 * Batch process favorite notifications, creating a notification (if prev unread) and notification action
 * for the owner of the favorited track/playlist/album
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processMilestoneListenNotifications (notifications, tx) {
  const validNotifications = []
  for (const notification of notifications) {
    const trackOwnerId = notification.initiator
    const trackId = notification.metadata.entity_id
    const threshold = notification.metadata.threshold
    const slot = notification.slot
  
    // Check for existing milestone
    let existingMilestoneQuery = await models.SolanaNotification.findAll({
      where: {
        userId: trackOwnerId,
        type: notificationTypes.MilestoneListen,
        entityId: trackId
      },
      include: [{
        model: models.SolanaNotificationAction,
        as: 'actions',
        where: {
          actionEntityType: actionEntityTypes.Track,
          actionEntityId: threshold
        }
      }],
      transaction: tx
    })
    if (existingMilestoneQuery.length === 0) {
      // MilestoneListen/Favorite/Repost
      // userId=user achieving milestone
      // entityId=Entity reaching milestone, one of track/collection
      // actionEntityType=Entity achieving milestone, can be track/collection
      // actionEntityId=Milestone achieved
      let createMilestoneTx = await models.SolanaNotification.create({
        userId: trackOwnerId,
        type: notificationTypes.MilestoneListen,
        entityId: trackId,
        slot
      }, { transaction: tx })
      let notificationId = createMilestoneTx.id
      await models.SolanaNotificationAction.findOrCreate({
        where: {
          notificationId,
          actionEntityType: actionEntityTypes.Track,
          actionEntityId: threshold,
          slot
        },
        transaction: tx
      })

      validNotifications.push(notification)
    }
 
  }
  return validNotifications

}

module.exports = processMilestoneListenNotifications
