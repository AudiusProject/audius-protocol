const models = require('../models')
const { logger } = require('../logging')
const axios = require('axios')
const config = require('../config.js')

async function pushAnnouncementNotifications () {
  try {
    logger.info('pushAnnouncementNotifications')
    const audiusNotificationUrl = config.get('audiusNotificationUrl')
    logger.info(audiusNotificationUrl)
    // TODO: move below to index-mobile.json
    const response = await axios.get(`${audiusNotificationUrl}/index.json`)
    logger.info(response.data)
    if (response.data && Array.isArray(response.data.notifications)) {
      // TODO: Worth slicing?
      await Promise.all(response.data.notifications.map((notif) => {
        processAnnouncement(notif)
      }))
    }
  } catch (e) {
    logger.error(`pushAnnouncementNotifications ${e}`)
  }
}

async function processAnnouncement (notif) {
  if (notif.type !== 'announcement') { return }
  logger.info('processAnnouncement')
  logger.info(notif)
  logger.info(notif.id)
  logger.info(notif.type)
  let pushedNotifRecord = await models.PushedAnnouncementNotifications.findAll({
    where: {
      announcementId: notif.id
    }
  })
  let pendingNotificationPush = pushedNotifRecord.length === 0
  if (!pendingNotificationPush) { return }
  await _pushAnnouncement(notif)
}

async function _pushAnnouncement (notif) {
  logger.info(`Sending notification ${notif.id}`)
  // Push notification to all users with a valid device token at this time
  let validDeviceRecords = await models.NotificationDeviceToken.findAll({
    where: {
      enabled: true
    }
  })
  await Promise.all(validDeviceRecords.map((device) => {
    logger.info(`Sending notif to ${device}`)
  }))

  // Update database record with notifiation id
  await models.PushedAnnouncementNotifications.create({ announcementId: notif.id })
}

module.exports = { pushAnnouncementNotifications }
