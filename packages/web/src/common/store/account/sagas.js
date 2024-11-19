import { userApiFetchSaga } from '@audius/common/api'
import { ErrorLevel, Kind } from '@audius/common/models'
import {
  FeatureFlags,
  createUserBankIfNeeded,
  getRootSolanaAccount
} from '@audius/common/services'
import {
  accountActions,
  accountSelectors,
  cacheActions,
  profilePageActions,
  solanaSelectors,
  getContext,
  fetchAccountAsync,
  cacheAccount
} from '@audius/common/store'
import { call, put, fork, select, takeEvery } from 'redux-saga/effects'

import { identify } from 'common/store/analytics/actions'
import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite, waitForRead } from 'utils/sagaHelpers'

import { retrieveCollections } from '../cache/collections/utils'

const { fetchProfile } = profilePageActions
const { getFeePayer } = solanaSelectors

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
  fetchAccountFailed,
  fetchAccount,
  fetchLocalAccount,
  twitterLogin,
  instagramLogin,
  tikTokLogin,
  fetchSavedPlaylists,
  addAccountPlaylist,
  resetAccount
} = accountActions

/**
 * Sets the sentry user so that alerts are tied to a user
 * @param user
 * @param traits an object of any key-value traits to associate with the user
 */
const setSentryUser = (sentry, user, traits) => {
  if (traits.isVerified) {
    sentry.setTag('isVerified', `${traits.isVerified}`)
  }
  if (traits.managerUserId) {
    sentry.setTag('isManagerMode', 'true')
  }
  sentry.configureScope((currentScope) => {
    currentScope.setUser({
      id: `${user.user_id}`,
      username: user.handle,
      ...traits
    })
  })
}

// Tasks to be run on account successfully fetched, e.g.
// recording metrics, setting user data
function* onSignedIn({ payload: { account } }) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const sentry = yield getContext('sentry')
  const analytics = yield getContext('analytics')
  const authService = yield getContext('authService')

  const libs = yield call([
    audiusBackendInstance,
    audiusBackendInstance.getAudiusLibs
  ])
  yield call([libs, libs.setCurrentUser], {
    wallet: account.wallet,
    userId: account.user_id
  })

  if (account && account.handle) {
    const { web3WalletAddress } = yield call([
      authService,
      authService.getWalletAddresses
    ])
    const { user: web3User } = yield call(userApiFetchSaga.getUserAccount, {
      wallet: web3WalletAddress
    })

    let solanaWallet
    let managerUserId
    let managerHandle

    // If operating as a managed account, identify the manager user id
    if (web3User && web3User.user_id !== account.user_id) {
      managerUserId = web3User.user_id
      managerHandle = web3User.handle
    } else {
      // If not a managed account, identify the Solana wallet associated with
      // the hedgehog wallet
      try {
        solanaWallet = (yield call(
          getRootSolanaAccount,
          audiusBackendInstance
        )).publicKey.toBase58()
      } catch (e) {
        console.error('Failed to fetch Solana root wallet during identify()', e)
      }
    }

    const traits = {
      isVerified: account.is_verified,
      trackCount: account.track_count,
      managerHandle,
      managerUserId,
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
}

export function* fetchLocalAccountAsync() {
  const localStorage = yield getContext('localStorage')

  yield put(accountActions.fetchAccountRequested())

  const cachedAccount = yield call([localStorage, 'getAudiusAccount'])
  const cachedAccountUser = yield call([localStorage, 'getAudiusAccountUser'])

  if (cachedAccount && cachedAccountUser && !cachedAccountUser.is_deactivated) {
    yield call(
      cacheAccount,
      { ...cachedAccountUser, local: true },
      cachedAccountUser.orderedPlaylists
    )
  } else {
    yield put(fetchAccountFailed({ reason: 'ACCOUNT_NOT_FOUND_LOCAL' }))
  }
}
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

function* watchResetAccount() {
  yield takeEvery(resetAccount.type, function* () {
    const audiusBackendInstance = yield getContext('audiusBackendInstance')
    const localStorage = yield getContext('localStorage')
    const libs = yield call(audiusBackendInstance.getAudiusLibs)
    yield call([libs, 'clearCurrentUser'])
    yield call([localStorage, 'clearAudiusAccount'])
    yield call([localStorage, 'clearAudiusAccountUser'])
  })
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
    watchAddAccountPlaylist,
    watchResetAccount
  ]
}
