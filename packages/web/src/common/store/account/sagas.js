import { ErrorLevel, Kind } from '@audius/common/models'
import {
  FeatureFlags,
  recordIP,
  createUserBankIfNeeded,
  getRootSolanaAccount
} from '@audius/common/services'
import {
  accountActions,
  accountSelectors,
  cacheActions,
  profilePageActions,
  chatActions,
  solanaSelectors,
  getContext
} from '@audius/common/store'
import { call, put, fork, select, takeEvery } from 'redux-saga/effects'

import { identify } from 'common/store/analytics/actions'
import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite, waitForRead } from 'utils/sagaHelpers'

import { retrieveCollections } from '../cache/collections/utils'

const { fetchProfile } = profilePageActions
const { getFeePayer } = solanaSelectors
const { fetchBlockees, fetchBlockers } = chatActions

const {
  getUserId,
  getUserHandle,
  getAccountUser,
  getAccountSavedPlaylistIds,
  getAccountOwnedPlaylistIds,
  getAccountToCache
} = accountSelectors

const {
  signedIn,
  showPushNotificationConfirmation,
  fetchAccountSucceeded,
  fetchAccountFailed,
  fetchAccount,
  fetchLocalAccount,
  twitterLogin,
  instagramLogin,
  tikTokLogin,
  fetchSavedPlaylists,
  addAccountPlaylist
} = accountActions

const IP_STORAGE_KEY = 'user-ip-timestamp'

/**
 * Sets the sentry user so that alerts are tied to a user
 * @param user
 * @param traits an object of any key-value traits to associate with the user
 */
const setSentryUser = (sentry, user, traits) => {
  if (traits.isVerified) {
    sentry.setTag('isVerified', `${traits.isVerified}`)
  }
  sentry.configureScope((currentScope) => {
    currentScope.setUser({
      id: `${user.user_id}`,
      username: user.handle,
      ...traits
    })
  })
}

function* recordIPIfNotRecent(handle) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const localStorage = yield getContext('localStorage')
  const timeBetweenRefresh = 24 * 60 * 60 * 1000
  const now = Date.now()
  const minAge = now - timeBetweenRefresh
  const storedIPStr = yield call([localStorage, 'getItem'], IP_STORAGE_KEY)
  const storedIP = storedIPStr && JSON.parse(storedIPStr)
  if (!storedIP || !storedIP[handle] || storedIP[handle].timestamp < minAge) {
    const { userIP, error } = yield call(recordIP, audiusBackendInstance)
    if (!error) {
      yield call(
        [localStorage, 'setItem'],
        IP_STORAGE_KEY,
        JSON.stringify({ ...storedIP, [handle]: { userIP, timestamp: now } })
      )
    }
  }
}

// Tasks to be run on account successfully fetched, e.g.
// recording metrics, setting user data
function* onSignedIn({ payload: { account } }) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const sentry = yield getContext('sentry')
  const analytics = yield getContext('analytics')
  if (account && account.handle) {
    let solanaWallet = ''
    try {
      solanaWallet = (yield call(
        getRootSolanaAccount,
        audiusBackendInstance
      )).publicKey.toBase58()
    } catch (e) {
      console.error('Failed to fetch Solana root wallet during identify()', e)
    }
    // Set analytics user context
    const traits = {
      isVerified: account.is_verified,
      trackCount: account.track_count,
      solanaWallet
    }
    yield put(identify(account.handle, traits))
    setSentryUser(sentry, account, traits)
  }

  yield put(showPushNotificationConfirmation())

  yield fork(audiusBackendInstance.updateUserLocationTimezone)

  // Fetch the profile so we get everything we need to populate
  // the left nav / other site-wide metadata.
  yield put(
    fetchProfile(account.handle, account.user_id, false, false, false, true)
  )

  // Add playlists that might not have made it into the user's library.
  // This could happen if the user creates a new playlist and then leaves their session.
  yield fork(addPlaylistsNotInLibrary)

  // Create userbank only if lazy is not enabled
  const feePayerOverride = yield select(getFeePayer)
  const getFeatureEnabled = yield getContext('getFeatureEnabled')
  if (!getFeatureEnabled(FeatureFlags.LAZY_USERBANK_CREATION_ENABLED)) {
    yield call(createUserBankIfNeeded, audiusBackendInstance, {
      recordAnalytics: analytics.track,
      feePayerOverride
    })
  }
}

export function* fetchAccountAsync({ isSignUp = false }) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const remoteConfigInstance = yield getContext('remoteConfigInstance')
  const isNativeMobile = yield getContext('isNativeMobile')
  const isElectron = yield getContext('isElectron')
  const fingerprintClient = yield getContext('fingerprintClient')

  yield put(accountActions.fetchAccountRequested())

  const account = yield call(audiusBackendInstance.getAccount)
  if (!account) {
    yield put(
      fetchAccountFailed({
        reason: 'ACCOUNT_NOT_FOUND'
      })
    )
    if (!isNativeMobile) {
      const localStorage = yield getContext('localStorage')
      yield call([localStorage, 'removeItem'], 'useMetaMask')
    }
    return
  }
  if (account.is_deactivated) {
    yield put(
      fetchAccountFailed({
        reason: 'ACCOUNT_DEACTIVATED'
      })
    )
    return
  }

  // Set the userId in the remoteConfigInstance
  remoteConfigInstance.setUserId(account.user_id)

  // Fire-and-forget fp identify
  const clientOrigin = isNativeMobile
    ? 'mobile'
    : isElectron
      ? 'desktop'
      : 'web'
  fingerprintClient.identify(account.user_id, clientOrigin)

  yield call(recordIPIfNotRecent, account.handle)

  // Cache the account and put the signedIn action. We're done.
  yield call(cacheAccount, account)
  yield put(signedIn({ account, isSignUp }))
}

export function* fetchLocalAccountAsync() {
  const localStorage = yield getContext('localStorage')
  const audiusBackendInstance = yield getContext('audiusBackendInstance')

  yield put(accountActions.fetchAccountRequested())

  const audiusLibs = yield call([audiusBackendInstance, audiusBackendInstance.getAudiusLibs])
  const wallet = yield call([audiusLibs.web3Manager, audiusLibs.web3Manager.getWalletAddress])
  const cachedAccount = yield call([localStorage, 'getAudiusAccount'])
  const cachedAccountUser = yield call([localStorage, 'getAudiusAccountUser'])
  const currentUserExists = yield call([localStorage, 'getCurrentUserExists'])

  const walletMatches = wallet.toLowerCase() === cachedAccountUser.wallet.toLowerCase()

  if (cachedAccount && cachedAccountUser && !cachedAccountUser.is_deactivated && walletMatches) {
    yield call(
      cacheAccount,
      { ...cachedAccountUser, local: true },
      cachedAccountUser.orderedPlaylists
    )
  } else if (!currentUserExists) {
    yield put(fetchAccountFailed({ reason: 'ACCOUNT_NOT_FOUND_LOCAL' }))
  }
}

function* cacheAccount(account) {
  const localStorage = yield getContext('localStorage')
  const getFeatureEnabled = yield getContext('getFeatureEnabled')
  const isChatEnabled = yield call(getFeatureEnabled, FeatureFlags.CHAT_ENABLED)
  const collections = account.playlists || []

  yield put(
    cacheActions.add(Kind.USERS, [
      { id: account.user_id, uid: 'USER_ACCOUNT', metadata: account }
    ])
  )

  const formattedAccount = {
    userId: account.user_id,
    collections
  }

  yield call([localStorage, 'setAudiusAccount'], formattedAccount)
  yield call([localStorage, 'setAudiusAccountUser'], account)

  yield put(fetchAccountSucceeded(formattedAccount))

  // Fetch user's chat blockee and blocker list after fetching their account
  if (isChatEnabled) {
    yield put(fetchBlockees())
    yield put(fetchBlockers())
  }
}

// Pull from redux cache and persist to local storage cache
export function* reCacheAccount() {
  const localStorage = yield getContext('localStorage')
  const account = yield select(getAccountToCache)
  const accountUser = yield select(getAccountUser)

  yield call([localStorage, 'setAudiusAccount'], account)
  yield call([localStorage, 'setAudiusAccountUser'], accountUser)
}

function* associateTwitterAccount(action) {
  const { uuid, profile } = action.payload
  yield waitForWrite()
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  try {
    const userId = yield select(getUserId)
    const handle = yield select(getUserHandle)
    yield call(
      audiusBackendInstance.associateTwitterAccount,
      uuid,
      userId,
      handle
    )

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
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  try {
    const userId = yield select(getUserId)
    const handle = yield select(getUserHandle)
    yield call(
      audiusBackendInstance.associateInstagramAccount,
      uuid,
      userId,
      handle
    )

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

function* associateTikTokAccount(action) {
  const { uuid, profile } = action.payload
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  try {
    const userId = yield select(getUserId)
    const handle = yield select(getUserHandle)
    yield call(
      audiusBackendInstance.associateTikTokAccount,
      uuid,
      userId,
      handle
    )

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

function* fetchSavedPlaylistsAsync() {
  yield waitForRead()

  // Fetch other people's playlists you've saved
  yield fork(function* () {
    const savedPlaylists = yield select(getAccountSavedPlaylistIds)
    if (savedPlaylists.length > 0) {
      yield call(retrieveCollections, savedPlaylists)
    }
  })

  // Fetch your own playlists
  yield fork(function* () {
    const ownPlaylists = yield select(getAccountOwnedPlaylistIds)
    if (ownPlaylists.length > 0) {
      yield call(retrieveCollections, ownPlaylists)
    }
  })
}

function* watchFetchAccount() {
  yield takeEvery(fetchAccount.type, fetchAccountAsync)
}

function* watchFetchAccountFailed() {
  yield takeEvery(accountActions.fetchAccountFailed.type, function* (action) {
    const userId = yield select(getUserId)
    if (userId) {
      yield call(reportToSentry, {
        level: ErrorLevel.Error,
        error: new Error(`Fetch account failed: ${action.payload.reason}`),
        additionalInfo: { userId }
      })
    }
  })
}

function* watchFetchLocalAccount() {
  yield takeEvery(fetchLocalAccount.type, fetchLocalAccountAsync)
}

function* watchSignedIn() {
  yield takeEvery(signedIn.type, onSignedIn)
}

function* watchTwitterLogin() {
  yield takeEvery(twitterLogin.type, associateTwitterAccount)
}

function* watchInstagramLogin() {
  yield takeEvery(instagramLogin.type, associateInstagramAccount)
}

function* watchTikTokLogin() {
  yield takeEvery(tikTokLogin.type, associateTikTokAccount)
}

function* watchFetchSavedPlaylists() {
  yield takeEvery(fetchSavedPlaylists.type, fetchSavedPlaylistsAsync)
}

function* watchAddAccountPlaylist() {
  yield takeEvery(addAccountPlaylist.type, reCacheAccount)
}

export default function sagas() {
  return [
    watchFetchAccount,
    watchFetchLocalAccount,
    watchFetchAccountFailed,
    watchSignedIn,
    watchTwitterLogin,
    watchInstagramLogin,
    watchTikTokLogin,
    watchFetchSavedPlaylists,
    watchAddAccountPlaylist
  ]
}
