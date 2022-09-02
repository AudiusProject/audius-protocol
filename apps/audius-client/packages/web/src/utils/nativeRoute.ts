import { OpenNotificationsMessage } from 'services/native-mobile-interface/notifications'

/**
 * On adding new native pages, add the ability to navigate back
 * to the page on the native layer
 * @param fromPage {string} The native page rendered previously
 */
export const onNativeBack = (fromPage: string) => {
  switch (fromPage) {
    case 'notifications':
      new OpenNotificationsMessage().send()
      break
    default:
  }
}
