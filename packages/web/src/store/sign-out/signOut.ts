import {
  LocalStorage,
  AudiusBackend,
  HedgehogInstance,
  AuthService
} from '@audius/common/services'

import { removeHasRequestedBrowserPermission } from 'utils/browserNotifications'

import { clearTheme } from '../../utils/theme/theme'

const AUDIUS_EVENTS = 'events'
const AUDIUS_USE_METAMASK = 'useMetaMask'
const BADGE_LOCAL_STORAGE_KEY = 'last_badge_tier'

const removeLocalStorageItems = async (localStorage: LocalStorage) => {
  const items = [AUDIUS_EVENTS, AUDIUS_USE_METAMASK, BADGE_LOCAL_STORAGE_KEY]
  return await Promise.all(items.map((k) => localStorage.removeItem(k)))
}

export const signOut = async (
  audiusBackendInstance: AudiusBackend,
  localStorage: LocalStorage,
  authService: AuthService
) => {
  await removeLocalStorageItems(localStorage)
  await localStorage.clearAudiusUserWalletOverride()
  await localStorage.clearAudiusAccount()
  await localStorage.clearAudiusAccountUser()
  await localStorage.clearPlaybackRate()
  removeHasRequestedBrowserPermission()
  // TODO-NOW
  await audiusBackendInstance.signOut()
  await authService.signOut()
  clearTheme()

  window.location.reload()
}
