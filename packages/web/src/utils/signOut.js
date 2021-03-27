/* globals localStorage */
import { clearTheme } from './theme/theme'
import AudiusBackend from 'services/AudiusBackend'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { removeHasRequestedBrowserPermission } from 'utils/browserNotifications'
import {
  clearAudiusAccount,
  clearAudiusAccountUser
} from 'services/LocalStorage'
import { BADGE_LOCAL_STORAGE_KEY } from 'containers/audio-rewards-page/Tiers'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const AUDIUS_EVENTS = 'events'
const AUDIUS_USE_METAMASK = 'useMetaMask'

const removeLocalStorageItems = () => {
  const items = [AUDIUS_EVENTS, AUDIUS_USE_METAMASK, BADGE_LOCAL_STORAGE_KEY]
  items.map(k => localStorage.removeItem(k))
}

export const signOut = () => {
  removeLocalStorageItems()
  clearAudiusAccount()
  clearAudiusAccountUser()
  removeHasRequestedBrowserPermission()
  AudiusBackend.signOut()
  clearTheme()

  if (NATIVE_MOBILE) {
    new ReloadMessage().send()
  } else {
    window.location.reload()
  }
}
