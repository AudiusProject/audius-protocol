import { call, put, fork, select, takeEvery } from 'redux-saga/effects'

import Kind from 'common/models/Kind'
import Status from 'common/models/Status'
import { USER_ID_AVAILABLE_EVENT } from 'common/services/remote-config/remote-config'
import * as accountActions from 'common/store/account/reducer'
import {
  getUserId,
  getUserHandle,
  getAccountUser,
  getAccountAlbumIds,
  getAccountSavedPlaylistIds,
  getAccountOwnedPlaylistIds,
  getAccountToCache
} from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchProfile } from 'common/store/pages/profile/actions'
import {
  setBrowserNotificationPermission,
  setBrowserNotificationEnabled,
  setBrowserNotificationSettingsOn
} from 'common/store/pages/settings/actions'
import { getFeePayer } from 'common/store/solana/selectors'
import { setVisibility } from 'common/store/ui/modals/slice'
import AudiusBackend from 'services/AudiusBackend'
import {
  getAudiusAccount,
  getAudiusAccountUser,
  getCurrentUserExists,
  setAudiusAccount,
  setAudiusAccountUser,
  clearAudiusAccount,
  clearAudiusAccountUser
} from 'services/LocalStorage'
import { recordIP } from 'services/audius-backend/RecordIP'
import { createUserBankIfNeeded } from 'services/audius-backend/waudio'
import fingerprintClient from 'services/fingerprint/FingerprintClient'
import { SignedIn } from 'services/native-mobile-interface/lifecycle'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { setSentryUser } from 'services/sentry'
import { identify } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import { addPlaylistsNotInLibrary } from 'store/playlist-library/sagas'
import {
  Permission,
  isPushManagerAvailable,
  isSafariPushAvailable,
  unsubscribePushManagerBrowser,
  getPushManagerPermission,
  getPushManagerBrowserSubscription,
  getSafariPushBrowser,
  subscribePushManagerBrowser,
  setHasRequestedBrowserPermission,
  removeHasRequestedBrowserPermission,
  shouldRequestBrowserPermission
} from 'utils/browserNotifications'
import { isMobile, isElectron } from 'utils/clientUtil'
import { waitForValue } from 'utils/sagaHelpers'

import mobileSagas, { setHasSignedInOnMobile } from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const IP_STORAGE_KEY = 'user-ip-timestamp'

function* recordIPIfNotRecent(handle) {
  const timeBetweenRefresh = 24 * 60 * 60 * 1000
  const now = Date.now()
  const minAge = now - timeBetweenRefresh
  const storedIPStr = window.localStorage.getItem(IP_STORAGE_KEY)
  const storedIP = storedIPStr && JSON.parse(storedIPStr)
  if (!storedIP || !storedIP[handle] || storedIP[handle].timestamp < minAge) {
    const { userIP, error } = yield call(recordIP)
    if (!error) {
      window.localStorage.setItem(
        IP_STORAGE_KEY,
        JSON.stringify({ ...storedIP, [handle]: { userIP, timestamp: now } })
      )
    }
  }
}

// Tasks to be run on account successfully fetched, e.g.
// recording metrics, setting user data
function* onFetchAccount(account) {
  if (account && account.handle) {
    // Set analytics user context
    const traits = {
      isVerified: account.is_verified,
      trackCount: account.track_count
    }
    yield put(identify(account.handle, traits))
    setSentryUser(account, traits)
  }

  if (shouldRequestBrowserPermission()) {
    setHasRequestedBrowserPermission()
    yield put(accountActions.showPushNotificationConfirmation())
  }

  yield fork(AudiusBackend.updateUserLocationTimezone)
  if (NATIVE_MOBILE) {
    yield fork(setHasSignedInOnMobile, account)
    new SignedIn(account).send()
  }

  // Fetch the profile so we get everything we need to populate
  // the left nav / other site-wide metadata.
  yield put(
    fetchProfile(account.handle, account.user_id, false, false, false, true)
  )

  // Add playlists that might not have made it into the user's library.
  // This could happen if the user creates a new playlist and then leaves their session.
  yield fork(addPlaylistsNotInLibrary)

  const feePayerOverride = yield select(getFeePayer)
  yield call(createUserBankIfNeeded, feePayerOverride)
}

export function* fetchAccountAsync(action) {
  let fromSource = false
  if (action) {
    fromSource = action.fromSource
  }
  yield put(accountActions.fetchAccountRequested())

  if (!fromSource) {
    const cachedAccount = getAudiusAccount()
    const cachedAccountUser = getAudiusAccountUser()
    if (
      cachedAccount &&
      cachedAccountUser &&
      !cachedAccountUser.is_deactivated
    ) {
      yield call(
        cacheAccount,
        cachedAccountUser,
        cachedAccountUser.orderedPlaylists
      )
      yield put(accountActions.fetchAccountSucceeded(cachedAccount))
    } else if (!getCurrentUserExists()) {
      yield put(
        accountActions.fetchAccountFailed({ reason: 'ACCOUNT_NOT_FOUND' })
      )
    }
  }

  const account = yield call(AudiusBackend.getAccount, fromSource)
  if (!account || account.is_deactivated) {
    yield put(
      accountActions.fetchAccountFailed({
        reason: account ? 'ACCOUNT_DEACTIVATED' : 'ACCOUNT_NOT_FOUND'
      })
    )
    // Clear local storage users if present
    clearAudiusAccount()
    clearAudiusAccountUser()
    // If the user is not signed in
    // Remove browser has requested push notifications.
    removeHasRequestedBrowserPermission()
    const browserPushSubscriptionStatus = yield call(
      fetchBrowserPushNotifcationStatus
    )
    if (
      browserPushSubscriptionStatus === Permission.GRANTED &&
      isPushManagerAvailable
    ) {
      const subscription = yield call(getPushManagerBrowserSubscription)
      yield call(AudiusBackend.disableBrowserNotifications, { subscription })
    } else if (
      browserPushSubscriptionStatus === Permission.GRANTED &&
      isSafariPushAvailable
    ) {
      const safariSubscription = yield call(getSafariPushBrowser)
      if (safariSubscription.permission === Permission.GRANTED) {
        yield call(
          AudiusBackend.deregisterDeviceToken,
          safariSubscription.deviceToken
        )
      }
    }
    return
  }

  // Set account ID and let remote-config provider
  // know that the user id is available
  remoteConfigInstance.setUserId(account.user_id)
  const event = new CustomEvent(USER_ID_AVAILABLE_EVENT)
  window.dispatchEvent(event)

  // Fire-and-forget fp identify
  fingerprintClient.identify(account.user_id)

  yield call(recordIPIfNotRecent, account.handle)

  // Cache the account and fire the onFetch callback. We're done.
  yield call(cacheAccount, account)
  yield call(onFetchAccount, account)
}

function* cacheAccount(account) {
  const collections = account.playlists || []

  yield put(
    cacheActions.add(Kind.USERS, [
      { id: account.user_id, uid: 'USER_ACCOUNT', metadata: account }
    ])
  )
  const hasFavoritedItem =
    collections.some((playlist) => playlist.user.id !== account.user_id) ||
    account.track_save_count > 0

  const formattedAccount = {
    userId: account.user_id,
    collections,
    hasFavoritedItem
  }
  setAudiusAccount(formattedAccount)
  setAudiusAccountUser(account)

  yield put(accountActions.fetchAccountSucceeded(formattedAccount))
}

// Pull from redux cache and persist to local storage cache
export function* reCacheAccount(action) {
  const account = yield select(getAccountToCache)
  const accountUser = yield select(getAccountUser)
  setAudiusAccount(account)
  setAudiusAccountUser(accountUser)
}

const setBrowerPushPermissionConfirmationModal = setVisibility({
  modal: 'BrowserPushPermissionConfirmation',
  visible: true
})

/**
 * Determine if the push notification modal should appear
 */
export function* showPushNotificationConfirmation() {
  if (isMobile() || isElectron()) return
  const account = yield select(getAccountUser)
  if (!account) return
  const browserPermission = yield call(fetchBrowserPushNotifcationStatus)
  if (browserPermission === Permission.DEFAULT) {
    yield put(setBrowerPushPermissionConfirmationModal)
  } else if (browserPermission === Permission.GRANTED) {
    if (isPushManagerAvailable) {
      const subscription = yield call(getPushManagerBrowserSubscription)
      const enabled = yield call(
        AudiusBackend.getBrowserPushSubscription,
        subscription.endpoint
      )
      if (!enabled) {
        yield put(setBrowerPushPermissionConfirmationModal)
      }
    } else if (isSafariPushAvailable) {
      try {
        const safariPushBrowser = yield call(getSafariPushBrowser)
        const enabled = yield call(
          AudiusBackend.getBrowserPushSubscription,
          safariPushBrowser.deviceToken
        )
        if (!enabled) {
          yield put(setBrowerPushPermissionConfirmationModal)
        }
      } catch (err) {
        console.log(err)
      }
    }
  }
}

export function* fetchBrowserPushNotifcationStatus() {
  if (isElectron() || isMobile()) return
  if (isPushManagerAvailable) {
    const permission = yield call(getPushManagerPermission)
    return permission
  } else if (isSafariPushAvailable) {
    const safariSubscription = yield call(getSafariPushBrowser)
    return safariSubscription.permission
  }
}

export function* subscribeBrowserPushNotifcations() {
  if (isPushManagerAvailable) {
    const pushManagerSubscription = yield call(
      getPushManagerBrowserSubscription
    )
    if (pushManagerSubscription) {
      yield put(setBrowserNotificationPermission(Permission.GRANTED))
      yield put(setBrowserNotificationEnabled(true, false))
      yield call(AudiusBackend.updateBrowserNotifications, {
        subscription: pushManagerSubscription
      })
      yield put(setBrowserNotificationSettingsOn())
    } else if (
      window.Notification &&
      window.Notification.permission !== Permission.DENIED
    ) {
      const subscription = yield call(subscribePushManagerBrowser)
      const enabled = !!subscription
      if (enabled) {
        yield put(setBrowserNotificationPermission(Permission.GRANTED))
        yield put(setBrowserNotificationEnabled(true, false))
        yield call(AudiusBackend.updateBrowserNotifications, { subscription })
      } else {
        yield put(setBrowserNotificationPermission(Permission.DENIED))
      }
    }
  }
  // Note: you cannot request safari permission from saga
  // it must be initiated from a user action (in the component)
  if (isSafariPushAvailable) {
    const safariSubscription = yield call(getSafariPushBrowser)
    if (safariSubscription.permission === Permission.GRANTED) {
      yield call(
        AudiusBackend.registerDeviceToken,
        safariSubscription.deviceToken,
        'safari'
      )
      yield put(setBrowserNotificationEnabled(true, false))
      yield put(setBrowserNotificationSettingsOn())
    }
  }
}

export function* unsubscribeBrowserPushNotifcations() {
  if (isPushManagerAvailable) {
    const pushManagerSubscription = yield call(unsubscribePushManagerBrowser)
    if (pushManagerSubscription) {
      yield call(AudiusBackend.disableBrowserNotifications, {
        subscription: pushManagerSubscription
      })
    }
  } else if (isSafariPushAvailable) {
    const safariSubscription = yield call(getSafariPushBrowser)
    if (safariSubscription.premission === Permission.GRANTED) {
      yield call(
        AudiusBackend.deregisterDeviceToken(safariSubscription.deviceToken)
      )
    }
  }
}

function* associateTwitterAccount(action) {
  const { uuid, profile } = action.payload
  try {
    const userId = yield select(getUserId)
    const handle = yield select(getUserHandle)
    yield call(AudiusBackend.associateTwitterAccount, uuid, userId, handle)

    const account = yield select(getAccountUser)
    const { verified } = profile
    if (!account.is_verified && verified) {
      yield put(
        cacheActions.update(Kind.USERS, [
          { id: userId, metadata: { is_verified: true } }
        ])
      )
    }
  } catch (err) {
    console.error(err.message)
  }
}

function* associateInstagramAccount(action) {
  const { uuid, profile } = action.payload
  try {
    const userId = yield select(getUserId)
    const handle = yield select(getUserHandle)
    yield call(AudiusBackend.associateInstagramAccount, uuid, userId, handle)

    const account = yield select(getAccountUser)
    const { is_verified: verified } = profile
    if (!account.is_verified && verified) {
      yield put(
        cacheActions.update(Kind.USERS, [
          { id: userId, metadata: { is_verified: true } }
        ])
      )
    }
  } catch (err) {
    console.error(err.message)
  }
}

function* fetchSavedAlbumsAsync() {
  yield call(waitForBackendSetup)
  const isAccountSet = (store) => store.account.status
  yield call(
    waitForValue,
    isAccountSet,
    null,
    (status) => status === Status.SUCCESS
  )
  const cachedSavedAlbums = yield select(getAccountAlbumIds)
  if (cachedSavedAlbums.length > 0) {
    yield call(retrieveCollections, null, cachedSavedAlbums)
  }
}

function* fetchSavedPlaylistsAsync() {
  yield call(waitForBackendSetup)
  const isAccountSet = (store) => store.account.status
  yield call(
    waitForValue,
    isAccountSet,
    null,
    (status) => status === Status.SUCCESS
  )

  // Fetch other people's playlists you've saved
  yield fork(function* () {
    const savedPlaylists = yield select(getAccountSavedPlaylistIds)
    if (savedPlaylists.length > 0) {
      yield call(retrieveCollections, null, savedPlaylists)
    }
  })

  // Fetch your own playlists
  yield fork(function* () {
    const ownPlaylists = yield select(getAccountOwnedPlaylistIds)
    if (ownPlaylists.length > 0) {
      yield call(retrieveCollections, null, ownPlaylists)
    }
  })
}

function* watchFetchAccount() {
  yield takeEvery(accountActions.fetchAccount.type, fetchAccountAsync)
}

function* watchTwitterLogin() {
  yield takeEvery(accountActions.twitterLogin.type, associateTwitterAccount)
}

function* watchInstagramLogin() {
  yield takeEvery(accountActions.instagramLogin.type, associateInstagramAccount)
}

function* watchFetchSavedAlbums() {
  yield takeEvery(accountActions.fetchSavedAlbums.type, fetchSavedAlbumsAsync)
}

function* watchFetchSavedPlaylists() {
  yield takeEvery(
    accountActions.fetchSavedPlaylists.type,
    fetchSavedPlaylistsAsync
  )
}

function* watchAddAccountPlaylist() {
  yield takeEvery(accountActions.addAccountPlaylist.type, reCacheAccount)
}

function* getBrowserPushNotifcations() {
  yield takeEvery(
    accountActions.fetchBrowserPushNotifications.type,
    fetchBrowserPushNotifcationStatus
  )
}

function* watchShowPushNotificationConfirmation() {
  yield takeEvery(
    accountActions.showPushNotificationConfirmation.type,
    showPushNotificationConfirmation
  )
}

function* subscribeBrowserPushNotification() {
  yield takeEvery(
    accountActions.subscribeBrowserPushNotifications.type,
    subscribeBrowserPushNotifcations
  )
}

function* unsubscribeBrowserPushNotification() {
  yield takeEvery(
    accountActions.unsubscribeBrowserPushNotifications.type,
    unsubscribeBrowserPushNotifcations
  )
}

export default function sagas() {
  const sagas = [
    watchFetchAccount,
    watchTwitterLogin,
    watchInstagramLogin,
    watchFetchSavedAlbums,
    watchFetchSavedPlaylists,
    watchShowPushNotificationConfirmation,
    watchAddAccountPlaylist,
    getBrowserPushNotifcations,
    subscribeBrowserPushNotification,
    unsubscribeBrowserPushNotification
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
