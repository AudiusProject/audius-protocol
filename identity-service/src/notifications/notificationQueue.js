const { drainMessageObject: sendAwsSns } = require('../awsSNS')
const { sendBrowserNotification, sendSafariNotification } = require('../webPush')

// TODO (DM) - move this into redis
let PUSH_NOTIFICATIONS_BUFFER = []

let PUSH_ANNOUNCEMENTS_BUFFER = []

async function publish (message, userId, tx, playSound = true, title = null, types) {
  await addNotificationToBuffer(message, userId, tx, PUSH_NOTIFICATIONS_BUFFER, playSound, title, types)
}

async function publishAnnouncement (message, userId, tx, playSound = true, title = null) {
  await addNotificationToBuffer(message, userId, tx, PUSH_ANNOUNCEMENTS_BUFFER, playSound, title)
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

async function drainPublishedMessages () {
  console.log(`\n\n DRAINING PUBLISHED MESSAGES \n\n`)
  for (let bufferObj of PUSH_NOTIFICATIONS_BUFFER) {
    console.log(`buffObjType: ${JSON.stringify(bufferObj.types, null, '')}`)
    if (bufferObj.types.includes('mobile')) {
      console.log(`Sending aws sns Notif ${JSON.stringify(bufferObj, null, '')}`)
      await sendAwsSns(bufferObj)
    } else if (bufferObj.types.includes('browser')) {
      console.log(`Sending Browser Notif ${JSON.stringify(bufferObj, null, '')}`)
      await Promise.all([
        sendBrowserNotification(bufferObj),
        sendSafariNotification(bufferObj)
      ])
    }
    console.log(`Sent Browser Notif w/out erroring`)
  }

  PUSH_NOTIFICATIONS_BUFFER = []
}

async function drainPublishedAnnouncements () {
  for (let bufferObj of PUSH_ANNOUNCEMENTS_BUFFER) {
    await Promise.all([
      sendAwsSns(bufferObj),
      sendBrowserNotification(bufferObj),
      sendSafariNotification(bufferObj)
    ])
  }

  PUSH_ANNOUNCEMENTS_BUFFER = []
}

module.exports = {
  publish,
  publishAnnouncement,
  drainPublishedMessages,
  drainPublishedAnnouncements
}
