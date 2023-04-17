import webpush from 'web-push'
import { logger } from './logger'
import { Knex } from 'knex'

// setup and configuration
let webPushIsConfigured = false
const vapidKeys = {
    publicKey: process.env.BROWSER_PUSH_VAPID_PUBLIC_KEY,
    privateKey: process.env.BROWSER_PUSH_VAPID_PRIVATE_KEY
  }
  const browserPushGCMAPIKey = process.env.BROWSER_PUSH_GCM_API_KEY
  if (vapidKeys.publicKey && vapidKeys.privateKey && browserPushGCMAPIKey) {
    webpush.setGCMAPIKey(browserPushGCMAPIKey)
    webpush.setVapidDetails(
      'mailto:contact@audius.co', // taken from identity
      vapidKeys.publicKey,
      vapidKeys.privateKey
    )
    // set config to true
    webPushIsConfigured = true
  } else {
    logger.warn(
      'Web Push is not configured. Browser Push API Notifs will NOT be sent'
    )
  }

// utility functions
const sendBrowserNotification = async (idDb: Knex, userId: string, title: string, message: string) => {
    let numSentNotifs = 0
  
    try {
      if (!webPushIsConfigured) return numSentNotifs
      const notificationBrowsers = await idDb('NotificationBrowserSubscriptions')
        .select('endpoint', 'p256dhKey', 'authKey')
        .where('userId', userId)
        .andWhere('enabled', true)
      await Promise.all(
        notificationBrowsers.map(async (notificationBrowser) => {
          const pushSubscription = {
            endpoint: notificationBrowser.endpoint,
            keys: {
              p256dh: notificationBrowser.p256dhKey,
              auth: notificationBrowser.authKey
            }
          }
          try {
            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify({ message, title: `${title} • Audius` })
            )
            numSentNotifs++
          } catch (err) {
            if (err.statusCode === 410) {
              // If the send Notification response was not successful
              // delete the browser subscription as it is no longer valid
              await idDb('NotificationBrowserSubscriptions')
                .where('userId', userId)
                .andWhere('endpoint', notificationBrowser.endpoint)
                .del()
            }
          }
        })
      )
    } catch (err) {
      logger.error(`Error in sending Push API browser notifications`)
    }
  
    return numSentNotifs
  }
