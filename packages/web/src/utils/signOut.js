import { IS_MOBILE_USER_KEY } from 'common/store/account/mobileSagas'
import { SignedOut } from 'services/native-mobile-interface/lifecycle'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { removeHasRequestedBrowserPermission } from 'utils/browserNotifications'

import { clearTheme } from './theme/theme'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const AUDIUS_EVENTS = 'events'
const AUDIUS_USE_METAMASK = 'useMetaMask'
const BADGE_LOCAL_STORAGE_KEY = 'last_badge_tier'

const removeLocalStorageItems = async (localStorage) => {
  const items = [
    AUDIUS_EVENTS,
    AUDIUS_USE_METAMASK,
    BADGE_LOCAL_STORAGE_KEY,
    IS_MOBILE_USER_KEY
  ]
  return await Promise.all(items.map((k) => localStorage.removeItem(k)))
}

export const signOut = async (audiusBackendInstance, localStorage) => {
  await removeLocalStorageItems(localStorage)
  await localStorage.clearAudiusAccount()
  await localStorage.clearAudiusAccountUser()
  removeHasRequestedBrowserPermission()
  await audiusBackendInstance.signOut()
  clearTheme()

  if (NATIVE_MOBILE) {
    new SignedOut().send()
    new ReloadMessage().send()
  } else {
    window.location.reload()
  }
}
