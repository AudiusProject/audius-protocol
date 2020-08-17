/*
*  Push Notifications
*/
/* global clients */

/* eslint-disable max-len */
// On Service Worker receiving a push notification.
// eslint-disable-next-line
self.addEventListener('push', function (event) {
  const pushEvent = JSON.parse(event.data.text())

  const options = {
    body: pushEvent.message,
    icon: 'images/icon_72x72.png',
    badge: 'images/icon_192x192.png',
    data: pushEvent
  }

  // eslint-disable-next-line
event.waitUntil(self.registration.showNotification(pushEvent.title, options))
})

// On Notification Click.
// eslint-disable-next-line
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  // NOTE: TODO: replace url with notifcation specific route
  const notificationURL = '/feed?openNotifications=true'
  event.waitUntil(clients.openWindow(notificationURL))
})
