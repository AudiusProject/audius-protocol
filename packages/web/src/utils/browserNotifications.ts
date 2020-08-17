import { IDENTITY_SERVICE } from 'services/AudiusBackend'
import { isElectron } from 'utils/clientUtil'

/*
 * Push Notifications
 * For browsers the implement the Push API
 *
 */

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const fcmWebPushPublicKey = process.env.REACT_APP_FCM_PUSH_PUBLIC_KEY as string
const safariWebPushID = process.env.REACT_APP_SAFARI_WEB_PUSH_ID
const webServiceUrl = `${IDENTITY_SERVICE}/push_notifications/safari`
const applicationServerPublicKey = fcmWebPushPublicKey
export const isPushManagerAvailable =
  !isElectron() &&
  !NATIVE_MOBILE &&
  'serviceWorker' in navigator &&
  'PushManager' in window
export const isSafariPushAvailable =
  !isElectron() &&
  !NATIVE_MOBILE &&
  'safari' in window &&
  'pushNotification' in (window as any).safari
export const isBrowserPushAvailable =
  isPushManagerAvailable || isSafariPushAvailable

export enum Permission {
  DEFAULT = 'default',
  GRANTED = 'granted',
  DENIED = 'denied'
}

let swRegistration: any = null

// Used to convert the application server key for service worker registration
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Subscribes the browser to the push api
export const subscribePushManagerBrowser = async () => {
  try {
    if (isPushManagerAvailable) {
      if (!isServiceWorkerRegistered()) {
        const isRegistered = await registerServiceWorker()
        if (!isRegistered) return null
      }
      const applicationServerKey = urlB64ToUint8Array(
        applicationServerPublicKey
      )
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      return subscription
    }
  } catch (err) {
    console.warn('Unable to subscribe push mananger browser')
  }
  return null
}

type SafariPermissionData =
  | { permission: Permission.DEFAULT }
  | { permission: Permission.DENIED }
  | { permission: Permission.GRANTED; deviceToken: string }

export const subscribeSafariPushBrowser = async (): Promise<SafariPermissionData | null> => {
  try {
    if (isSafariPushAvailable) {
      const subscription = await new Promise(resolve => {
        ;(window as any).safari.pushNotification.requestPermission(
          webServiceUrl, // The web service URL.
          safariWebPushID, // The Website Push ID.
          {}, // Data that you choose to send to your server to help you identify the user.
          resolve // The callback function.
        )
      })
      return subscription as SafariPermissionData
    }
  } catch (err) {
    console.warn('Unable to subscribe safari push browser')
  }
  return null
}

export const unsubscribePushManagerBrowser = async () => {
  try {
    if (!isServiceWorkerRegistered()) {
      const isRegistered = await registerServiceWorker()
      if (!isRegistered) return null
    }
    const subscription = swRegistration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
    return subscription
  } catch (error) {
    console.log('Error unsubscribing', error)
    return null
  }
}

export const getPushManagerBrowserSubscription = async () => {
  try {
    if (!isServiceWorkerRegistered()) {
      const isRegistered = await registerServiceWorker()
      if (!isRegistered) return null
    }
    const subscription = await swRegistration.pushManager.getSubscription()
    return subscription
  } catch (err) {
    console.error('Error getting Push Manager', err)
    return null
  }
}

export const getPushManagerPermission = async (): Promise<Permission | null> => {
  try {
    if (!isServiceWorkerRegistered()) {
      const isRegistered = await registerServiceWorker()
      if (!isRegistered) return null
    }
    const subscription = await swRegistration.pushManager.getSubscription()
    if (subscription) return Permission.GRANTED
    if (Notification.permission === Permission.DENIED) return Permission.DENIED
    return Permission.DEFAULT
  } catch (err) {
    console.error('Error getting Push Manager Permission', err)
    return null
  }
}

export const isServiceWorkerRegistered = () => {
  return isPushManagerAvailable && swRegistration
}

export const registerServiceWorker = async () => {
  if (isPushManagerAvailable) {
    try {
      const swReg = await navigator.serviceWorker.register('/scripts/sw.js')
      swRegistration = swReg
      return true
    } catch (error) {
      console.error('Service Worker Error', error)
    }
  }
  return false
}

export const getSafariPushBrowser = () => {
  return (window as any).safari.pushNotification.permission(safariWebPushID)
}

export const getSafariPushPermission = (): Permission => {
  const permissionData = (window as any).safari.pushNotification.permission(
    safariWebPushID
  )
  return permissionData.permission
}

// The localstorage variable 'HAS_REQUESTED_BROWSER_PUSH_PERMISSION' is used to know
// if the browser permission has been requested by the signed in user
const HAS_REQUESTED_BROWSER_PUSH_PERMISSION =
  'HAS_REQUESTED_BROWSER_PUSH_PERMISSION'

export const setHasRequestedBrowserPermission = () => {
  window.localStorage.setItem(HAS_REQUESTED_BROWSER_PUSH_PERMISSION, 'true')
}

export const removeHasRequestedBrowserPermission = () => {
  window.localStorage.removeItem(HAS_REQUESTED_BROWSER_PUSH_PERMISSION)
}

export const shouldRequestBrowserPermission = () => {
  const reqBrowserPushBPermission = window.localStorage.getItem(
    HAS_REQUESTED_BROWSER_PUSH_PERMISSION
  )
  return !reqBrowserPushBPermission
}
