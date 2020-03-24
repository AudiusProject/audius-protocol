const webpush = require('web-push')
const config = require('./config')
const models = require('./models')

const browserPushGCMAPIKey = config.get('browserPushGCMAPIKey')
const browserPushVapidPublicKey = config.get('browserPushVapidPublicKey')
const browserPushVapidPrivateKey = config.get('browserPushVapidPrivateKey')

const vapidKeys = {
  publicKey: browserPushVapidPublicKey,
  privateKey: browserPushVapidPrivateKey
}
webpush.setGCMAPIKey(browserPushGCMAPIKey)
webpush.setVapidDetails(
  'mailto:contact@audius.co',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

const sendBrowserNotification = async ({ userId, notificationParams }) => {
  const { message, title } = notificationParams
  const notificationBrowsers = await models.NotificationBrowserSubscription.findAll({ where: { userId, enabled: true } })
  await Promise.all(notificationBrowsers.map(async (notificationBrowser) => {
    const pushSubscription = {
      'endpoint': notificationBrowser.endpoint,
      'keys': {
        'p256dh': notificationBrowser.p256dhKey,
        'auth': notificationBrowser.authKey
      }
    }
    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify({ message, title }))
    } catch (err) {
      // If the send Notification response was not successful
      // delete the browser subscription as it is no longer valid
      await notificationBrowser.destroy()
    }
  }))
}

// TODO: implement w/ correct options and configuration
const sendSafariNotification = async () => {}

/*
// Send notif to safari
var apn = require('apn')

var options = {
  token: {
    key: path.resolve(__dirname, './notifications/browserPush/audius.pushpackage/AuthKey_JF59JDH2B2.p8'),
    keyId: 'JF59JDH2B2',
    teamId: 'LRFCG93S85'
  },
  production: true
}

const apnProvider = new apn.Provider(options)

const sendSafariNotification = async ({ userId, notificationParams }) => {
  const note = new apn.Notification()

  const { message, title } = notificationParams

  note.topic = 'web.co.audius' // Required: The destination topic for the notification.
  note.pushType = 'alert' // Required: alert or background
  note.expiry = Math.floor(Date.now() / 1000) + 3600 // Expires 1 hour from now.
  note.alert = { title, body: message }
  note.urlArgs = ['']
  note.payload = {}

  const notifcationDevices = await models.NotificationDeviceToken.findAll({
    where: { userId, enabled: true, deviceType: 'safari' }
  })

  await Promise.all(notifcationDevices.map(async (notificationDevice) => {
    try {
      const result = await apnProvider.send(note, notificationDevice.deviceToken)
      if (result.failed && result.failed.length > 0) {
        for (let failed of result.failed) {
          if (failed.response && failed.response.reason === 'BadDeviceToken') {
            // TODO: Remove device token
            await models.NotificationDeviceToken.destroy({
              where: {
                userId,
                deviceToken: notificationDevice.deviceToken,
                deviceType: 'safari'
              }
            })
          }
        }
      }
    } catch (err) {
      logger.error(`Error sending browser notification to APNs w/ device token: ${notificationDevice.deviceToken}`)
    }
  }))
}
*/
module.exports.sendBrowserNotification = sendBrowserNotification
module.exports.sendSafariNotification = sendSafariNotification
