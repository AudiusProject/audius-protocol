import { call, put, fork, select, takeEvery } from 'redux-saga/effects'

import { waitForBackendSetup } from 'store/backend/sagas'
import * as accountActions from 'store/account/reducer'
import * as cacheActions from 'store/cache/actions'
import * as uploadActions from 'containers/upload-page/store/actions'
import { Kind, Status } from 'store/types'
import AudiusBackend from 'services/AudiusBackend'
import mobileSagas from './mobileSagas'
import { identify } from 'store/analytics/actions'
import { waitForValue } from 'utils/sagaHelpers'
import {
  getUserId,
  getUserHandle,
  getAccountUser,
  getAccountAlbumIds,
  getAccountSavedPlaylistIds,
  getAccountOwnedPlaylistIds
} from 'store/account/selectors'
import { retrieveCollections } from 'store/cache/collections/utils'
import { open as openBrowserPushPermissionModal } from 'store/application/ui/browserPushPermissionConfirmation/actions'
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
import {
  setBrowserNotificationPermission,
  setBrowserNotificationEnabled,
  setBrowserNotificationSettingsOn
} from 'containers/settings-page/store/actions'
import { isMobile, isElectron } from 'utils/clientUtil'
import { setUserId } from 'services/remote-config/Provider'
import {
  getAudiusAccount,
  getAudiusAccountUser,
  getCurrentUserExists,
  setAudiusAccount,
  setAudiusAccountUser,
  clearAudiusAccount,
  clearAudiusAccountUser
} from 'services/LocalStorage'
import { SignedIn } from 'services/native-mobile-interface/lifecycle'
import { setSentryUser } from 'services/sentry'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

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
  yield fork(AudiusBackend.updateUserEvent, {
    hasSignedInNativeMobile: !!NATIVE_MOBILE
  })
  if (NATIVE_MOBILE) {
    new SignedIn(account).send()
  }
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
    if (cachedAccount && cachedAccountUser) {
      yield call(
        cacheAccount,
        cachedAccountUser,
        cachedAccountUser.orderedPlaylists
      )
      yield put(accountActions.fetchAccountSucceeded(cachedAccount))
    } else {
      if (!getCurrentUserExists()) {
        yield put(accountActions.fetchAccountFailed())
      }
    }
  }

  const account = yield call(AudiusBackend.getAccount, fromSource)
  if (!account) {
    yield put(accountActions.fetchAccountFailed())
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

  // Set account ID in remote-config provider
  setUserId(account.user_id)

  // Fetch "ordered" playlist identifiers to put in the store
  // TODO: Support proper ordering of playlists
  const accountPlaylistFavorites = yield call(
    AudiusBackend.getAccountPlaylistFavorites
  )
  const orderedPlaylists = accountPlaylistFavorites
    ? accountPlaylistFavorites.favorites
    : []
  yield call(cacheAccount, account, [...new Set(orderedPlaylists)])

  yield call(onFetchAccount, account)
}

function* cacheAccount(account, orderedPlaylists) {
  const collections = account.playlists || []

  yield put(
    cacheActions.add(Kind.USERS, [
      { id: account.user_id, uid: 'USER_ACCOUNT', metadata: account }
    ])
  )
  const hasFavoritedItem =
    collections.some(playlist => playlist.user.id !== account.user_id) ||
    account.track_save_count > 0

  const formattedAccount = {
    userId: account.user_id,
    collections,
    orderedPlaylists,
    hasFavoritedItem
  }
  setAudiusAccount(formattedAccount)
  setAudiusAccountUser(account)

  yield put(accountActions.fetchAccountSucceeded(formattedAccount))
}

/**
 * Determine if the push notification modal should appear
 */
export function* showPushNotificationConfirmation() {
  if (isMobile() || isElectron()) return
  const account = yield select(getAccountUser)
  if (!account) return
  const browserPermission = yield call(fetchBrowserPushNotifcationStatus)
  if (browserPermission === Permission.DEFAULT) {
    yield put(openBrowserPushPermissionModal())
  } else if (browserPermission === Permission.GRANTED) {
    if (isPushManagerAvailable) {
      const subscription = yield call(getPushManagerBrowserSubscription)
      const enabled = yield call(
        AudiusBackend.getBrowserPushSubscription,
        subscription.endpoint
      )
      if (!enabled) {
        yield put(openBrowserPushPermissionModal())
      }
    } else if (isSafariPushAvailable) {
      try {
        const safariPushBrowser = yield call(getSafariPushBrowser)
        const enabled = yield call(
          AudiusBackend.getBrowserPushSubscription,
          safariPushBrowser.deviceToken
        )
        if (!enabled) {
          yield put(openBrowserPushPermissionModal())
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
  const isAccountSet = store => store.account.status
  yield call(
    waitForValue,
    isAccountSet,
    null,
    status => status === Status.SUCCESS
  )
  const cachedSavedAlbums = yield select(getAccountAlbumIds)
  if (cachedSavedAlbums.length > 0) {
    yield call(retrieveCollections, null, cachedSavedAlbums)
  }
}

function* fetchSavedPlaylistsAsync() {
  yield call(waitForBackendSetup)
  const isAccountSet = store => store.account.status
  yield call(
    waitForValue,
    isAccountSet,
    null,
    status => status === Status.SUCCESS
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

function* setAccountCreator(action) {
  yield call(waitForBackendSetup)
  const account = yield select(getAccountUser)
  if (!account.is_creator) {
    yield put(
      cacheActions.update(Kind.USERS, [
        { id: account.user_id, metadata: { is_creator: true } }
      ])
    )
  }
}

function* watchUploadAccountCreator() {
  yield takeEvery(uploadActions.UPLOAD_TRACKS_SUCCEEDED, setAccountCreator)
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
    watchUploadAccountCreator,
    getBrowserPushNotifcations,
    subscribeBrowserPushNotification,
    unsubscribeBrowserPushNotification
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
