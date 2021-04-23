import { OpenNotificationsMessage } from 'services/native-mobile-interface/notifications'
import { OpenSearchMessage } from 'services/native-mobile-interface/search'

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
    case 'search':
      new OpenSearchMessage({ reset: false }).send()
      break
    default:
  }
}
