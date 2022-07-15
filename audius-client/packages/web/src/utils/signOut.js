import { BADGE_LOCAL_STORAGE_KEY } from 'pages/audio-rewards-page/Tiers'
import AudiusBackend from 'services/AudiusBackend'
import {
  clearAudiusAccount,
  clearAudiusAccountUser
} from 'services/LocalStorage'
import { SignedOut } from 'services/native-mobile-interface/lifecycle'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { IS_MOBILE_USER_KEY } from 'store/account/mobileSagas'
import { removeHasRequestedBrowserPermission } from 'utils/browserNotifications'

import { clearTheme } from './theme/theme'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const AUDIUS_EVENTS = 'events'
const AUDIUS_USE_METAMASK = 'useMetaMask'

const removeLocalStorageItems = () => {
  const items = [
    AUDIUS_EVENTS,
    AUDIUS_USE_METAMASK,
    BADGE_LOCAL_STORAGE_KEY,
    IS_MOBILE_USER_KEY
  ]
  items.map((k) => localStorage.removeItem(k))
}

export const signOut = async () => {
  removeLocalStorageItems()
  clearAudiusAccount()
  clearAudiusAccountUser()
  removeHasRequestedBrowserPermission()
  await AudiusBackend.signOut()
  clearTheme()

  if (NATIVE_MOBILE) {
    new SignedOut().send()
    new ReloadMessage().send()
  } else {
    window.location.reload()
  }
}
