import webpush from 'web-push'
import { logger } from './logger'
import { Browser, UserNotificationSettings, WebPush } from './processNotifications/mappers/userNotificationSettings'

export const configureWebPush = () => {
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
    logger.info('Web Push is configured')
  } else {
    logger.warn(
      'Web Push is not configured. Browser Push API Notifs will NOT be sent'
    )
  }
  globalThis.webPushIsConfigured = webPushIsConfigured
  return webPushIsConfigured
}

// utility functions
export const sendBrowserNotification = async (settings: UserNotificationSettings, userId: number, title: string, message: string) => {
    let numSentNotifs = 0
  
    try {
      if (!globalThis.webPushIsConfigured) return numSentNotifs
      const userBrowserSettings = await settings.getUserBrowserSettings([userId])
      const userNotificationSettings = userBrowserSettings[userId]

      const isWebPush = (browser: Browser): boolean => {
        return (browser as WebPush).p256dhKey !== undefined;
      }

      // if pass then web push, skip custom safari entries
      // safe cast when using filter
      const notificationBrowsers = userNotificationSettings.browser.filter(isWebPush) as WebPush[]

      logger.info(`Processing ${notificationBrowsers.length} web push notifications for ${userId}`)

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
              const idDb = settings.identityDB
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
      logger.error(`Error in sending Push API browser notifications ${err}`)
    }
  
    return numSentNotifs
  }
