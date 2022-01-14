const { deviceType } = require('./constants')
const { drainMessageObject: sendAwsSns } = require('../awsSNS')
const { sendBrowserNotification, sendSafariNotification } = require('../webPush')
const racePromiseWithTimeout = require('../utils/racePromiseWithTimeout.js')

const SEND_NOTIF_TIMEOUT_MS = 20000 // 20 sec

// TODO (DM) - move this into redis
const pushNotificationQueue = {
  PUSH_NOTIFICATIONS_BUFFER: [],
  PUSH_SOLANA_NOTIFICATIONS_BUFFER: [],
  PUSH_ANNOUNCEMENTS_BUFFER: []
}

async function publish (message, userId, tx, playSound = true, title = null, types) {
  await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER, playSound, title, types)
}

async function publishSolanaNotification (message, userId, tx, playSound = true, title = null, types) {
  await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER, playSound, title, types)
}

async function publishAnnouncement (message, userId, tx, playSound = true, title = null) {
  await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER, playSound, title)
}

async function addNotificationToBuffer (message, userId, tx, buffer, playSound, title, types) {
  const bufferObj = {
    userId,
    notificationParams: { message, title, playSound },
    types
  }
  let existingEntriesCheck = buffer.filter(
    entry => (
      (entry.userId === userId) && (entry.notificationParams.message === message)
    )
  )
  // Ensure no dups are added
  if (existingEntriesCheck.length > 0) return
  buffer.push(bufferObj)
}

async function _sendNotification (notifFn, bufferObj, logger) {
  const logPrefix = `[notificationQueue:sendNotification] [${notifFn.name}] [userId ${bufferObj.userId}]`

  try {
    const start = Date.now()

    await racePromiseWithTimeout(
      notifFn(bufferObj),
      SEND_NOTIF_TIMEOUT_MS,
      `Timed out in ${SEND_NOTIF_TIMEOUT_MS}ms`
    )

    logger.debug(`${logPrefix} Succeeded in ${Date.now() - start}`)
  } catch (e) {
    // Swallow error - log and continue
    logger.error(`${logPrefix} ERROR ${e.message}`)
  }
}

async function drainPublishedMessages (logger) {
  logger.info(`[notificationQueue:drainPublishedMessages] Beginning processing of ${pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER.length} notifications...`)

  for (let bufferObj of pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER) {
    if (bufferObj.types.includes(deviceType.Mobile)) {
      await _sendNotification(sendAwsSns, bufferObj, logger)
    }
    if (bufferObj.types.includes(deviceType.Browser)) {
      await Promise.all([
        _sendNotification(sendBrowserNotification, bufferObj, logger),
        _sendNotification(sendSafariNotification, bufferObj, logger)
      ])
    }
  }

  pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = []
}

async function drainPublishedSolanaMessages (logger) {
  logger.info(`[notificationQueue:drainPublishedSolanaMessages] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`)

  for (let bufferObj of pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER) {
    if (bufferObj.types.includes(deviceType.Mobile)) {
      await _sendNotification(sendAwsSns, bufferObj, logger)
    }
    if (bufferObj.types.includes(deviceType.Browser)) {
      await Promise.all([
        _sendNotification(sendBrowserNotification, bufferObj, logger),
        _sendNotification(sendSafariNotification, bufferObj, logger)
      ])
    }
  }

  pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER = []
}

async function drainPublishedAnnouncements (logger) {
  logger.info(`[notificationQueue:drainPublishedAnnouncements] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`)

  for (let bufferObj of pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER) {
    await Promise.all([
      _sendNotification(sendAwsSns, bufferObj, logger),
      _sendNotification(sendBrowserNotification, bufferObj, logger),
      _sendNotification(sendSafariNotification, bufferObj, logger)
    ])
  }

  pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER = []
}

module.exports = {
  pushNotificationQueue,
  publish,
  publishSolanaNotification,
  publishAnnouncement,
  drainPublishedMessages,
  drainPublishedSolanaMessages,
  drainPublishedAnnouncements
}
