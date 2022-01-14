const { deviceType } = require('./constants')
const { drainMessageObject: sendAwsSns } = require('../awsSNS')
const { sendBrowserNotification, sendSafariNotification } = require('../webPush')
const { logger } = require('../logging.js')

// TODO (DM) - move this into redis
const pushNotificationQueue = {
  PUSH_NOTIFICATIONS_BUFFER: [],
  PUSH_SOLANA_NOTIFICATIONS_BUFFER: [],
  PUSH_ANNOUNCEMENTS_BUFFER: []
}

/**
 * types = array
 */
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

// Promise.race resolves when first promise resolves, and will fulfill or reject correspondingly
// TODO move to util
const racePromiseWithTimeout = async (requestPromise, timeoutMs, timeoutMsg) => {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error(timeoutMsg)), timeoutMs)
  })
  return Promise.race([requestPromise, timeoutPromise])
}

// guessed a value
const DRAIN_PUBLISHED_MSG_TIMEOUT_MS = 5000 // 5 sec

// TODO replicate changes to `drainPublishedSolanaMessages` and `drainPublishedAnnouncements`
// max(function runtime) = PUSH_NOTIFICATIONS_BUFFER.length * 2 * DRAIN_PUBLISHED_MSG_TIMEOUT_MS
async function drainPublishedMessages () {
  const queue = pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER

  logger.info(`[notificationQueue:drainPublishedMessages] Beginning processing of ${queue.length} push notifications...`)

  /**
   * Process all notifs sequentially
   * bufferObj.types is an array, can contain multiple device types
   */
  const failedBufferObjs = []
  for (let bufferObj of queue) {
    const typesSet = new Set(bufferObj.types) // convert to set for easy manipulation

    if (typesSet.has(deviceType.Mobile)) {
      try {
        // Will throw an Error if call fails or times out
        await racePromiseWithTimeout(
          sendAwsSns(bufferObj),
          DRAIN_PUBLISHED_MSG_TIMEOUT_MS,
          `sendAwsSns() timed out in ${DRAIN_PUBLISHED_MSG_TIMEOUT_MS}`
        )

        // on success remove from set
        typesSet.delete(deviceType.Mobile)
      } catch (e) {
        logger.error(`[notificationQueue:drainPublishedMessages] ERROR userId ${bufferObj.userId} type ${deviceType.Mobile} - ${e.message}`)
      }
    }

    if (typesSet.has(deviceType.Browser)) {
      try {
        // Will throw an Error if call fails or times out
        await racePromiseWithTimeout(
          // TODO currently it is both or nothing - can separate these if desired
          Promise.all([
            sendBrowserNotification(bufferObj),
            sendSafariNotification(bufferObj)
          ]),
          DRAIN_PUBLISHED_MSG_TIMEOUT_MS,
          `sendBrowserNotification() or sendSafariNotification timed out in ${DRAIN_PUBLISHED_MSG_TIMEOUT_MS}`
        )

        // on both success remove from set; retry both if either fails (TODO can change)
        typesSet.delete(deviceType.Browser)
      } catch (e) {
        logger.error(`[notificationQueue:drainPublishedMessages] ERROR userId ${bufferObj.userId} type ${deviceType.Browser} - ${e.message}`)
      }

      // on success remove from set
      typesSet.delete(deviceType.Mobile)
    }

    if (typesSet.size) {
      const newBufferObj = { ...bufferObj, types: [...typesSet] }
      failedBufferObjs.push(newBufferObj)
    }
  }

  // Add failedBufferObjs to queue to be processed next time
  pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = failedBufferObjs
}

async function drainPublishedSolanaMessages () {
  for (let bufferObj of pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER) {
    if (bufferObj.types.includes(deviceType.Mobile)) {
      await sendAwsSns(bufferObj)
    }
    if (bufferObj.types.includes(deviceType.Browser)) {
      await Promise.all([
        sendBrowserNotification(bufferObj),
        sendSafariNotification(bufferObj)
      ])
    }
  }
  pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER = []
}

async function drainPublishedAnnouncements () {
  for (let bufferObj of pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER) {
    await Promise.all([
      sendAwsSns(bufferObj),
      sendBrowserNotification(bufferObj),
      sendSafariNotification(bufferObj)
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
