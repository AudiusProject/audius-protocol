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

/**
 * Wrapper function to call `notifFn` inside `racePromiseWithTimeout()`
 *
 * @notice swallows any error to ensure execution continues
 * @notice assumes `notifFn` always returns integer indicationg number of sent notifications
 * @returns numSentNotifs
 */
async function _sendNotification (notifFn, bufferObj, logger) {
  const logPrefix = `[notificationQueue:sendNotification] [${notifFn.name}] [userId ${bufferObj.userId}]`

  let numSentNotifs = 0
  try {
    const start = Date.now()

    numSentNotifs = await racePromiseWithTimeout(
      notifFn(bufferObj),
      SEND_NOTIF_TIMEOUT_MS,
      `Timed out in ${SEND_NOTIF_TIMEOUT_MS}ms`
    )

    logger.debug(`${logPrefix} Succeeded in ${Date.now() - start}ms`)
  } catch (e) {
    // Swallow error - log and continue
    logger.error(`${logPrefix} ERROR ${e.message}`)
  }

  return numSentNotifs
}

async function drainPublishedMessages (logger) {
  logger.info(`[notificationQueue:drainPublishedMessages] Beginning processing of ${pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER.length} notifications...`)

  let numProcessedNotifs = 0
  for (let bufferObj of pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER) {
    if (bufferObj.types.includes(deviceType.Mobile)) {
      const numSentNotifs = await _sendNotification(sendAwsSns, bufferObj, logger)
      numProcessedNotifs += numSentNotifs
    }
    if (bufferObj.types.includes(deviceType.Browser)) {
      const numSentNotifsArr = await Promise.all([
        _sendNotification(sendBrowserNotification, bufferObj, logger),
        _sendNotification(sendSafariNotification, bufferObj, logger)
      ])
      numSentNotifsArr.forEach(numSentNotifs => { numProcessedNotifs += numSentNotifs })
    }
  }

  pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = []

  return numProcessedNotifs
}

async function drainPublishedSolanaMessages (logger) {
  logger.info(`[notificationQueue:drainPublishedSolanaMessages] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`)

  let numProcessedNotifs = 0
  for (let bufferObj of pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER) {
    if (bufferObj.types.includes(deviceType.Mobile)) {
      const numSentNotifs = await _sendNotification(sendAwsSns, bufferObj, logger)
      numProcessedNotifs += numSentNotifs
    }
    if (bufferObj.types.includes(deviceType.Browser)) {
      const numSentNotifsArr = await Promise.all([
        _sendNotification(sendBrowserNotification, bufferObj, logger),
        _sendNotification(sendSafariNotification, bufferObj, logger)
      ])
      numSentNotifsArr.forEach(numSentNotifs => { numProcessedNotifs += numSentNotifs })
    }
  }

  pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER = []

  return numProcessedNotifs
}

async function drainPublishedAnnouncements (logger) {
  logger.info(`[notificationQueue:drainPublishedAnnouncements] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`)

  let numProcessedNotifs = 0
  for (let bufferObj of pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER) {
    const numSentNotifsArr = await Promise.all([
      _sendNotification(sendAwsSns, bufferObj, logger),
      _sendNotification(sendBrowserNotification, bufferObj, logger),
      _sendNotification(sendSafariNotification, bufferObj, logger)
    ])
    numSentNotifsArr.forEach(numSentNotifs => { numProcessedNotifs += numSentNotifs })
  }

  pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER = []

  return numProcessedNotifs
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
