import { SagaIterator } from 'redux-saga'
import { call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'

import { userApiFetchSaga } from '~/api/user'
import { AccountUserMetadata, Id, Kind, Status } from '~/models'
import { accountActions, accountSelectors } from '~/store/account'
import {
  getUserId,
  getUserHandle,
  getAccountUser
} from '~/store/account/selectors'
import { getContext } from '~/store/effects'
import { chatActions } from '~/store/pages/chat'
import { UPLOAD_TRACKS_SUCCEEDED } from '~/store/upload/actions'

import { cacheActions } from '../cache'
import { getSDK } from '../sdkUtils'

import {
  fetchAccountFailed,
  fetchAccountSucceeded,
  fetchHasTracks,
  setHasTracks,
  setWalletAddresses,
  twitterLogin,
  instagramLogin,
  tikTokLogin,
  signedIn
} from './slice'

const { fetchBlockees, fetchBlockers } = chatActions
const IP_STORAGE_KEY = 'user-ip-timestamp'

function* handleFetchTrackCount() {
  const currentUserId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  const sdk = yield* getSDK()

  if (!currentUserId || !handle) return

  try {
    const { data = [] } = yield* call(
      [sdk.full.users, sdk.full.users.getTracksByUserHandle],
      {
        handle,
        userId: Id.parse(currentUserId),
        limit: 1
      }
    )

    yield* put(setHasTracks(data.length > 0))
  } catch (e) {
    console.warn('failed to fetch own user tracks')
  }
}

export function* fetchAccountAsync({ isSignUp = false }): SagaIterator {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const authService = yield* getContext('authService')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const accountStatus = yield* select(accountSelectors.getAccountStatus)
  // Don't revert successful local account fetch
  if (accountStatus !== Status.SUCCESS) {
    yield* put(accountActions.fetchAccountRequested())
  }
  yield* call([
    authService.hedgehogInstance,
    authService.hedgehogInstance.refreshWallet
  ])

  const { accountWalletAddress: wallet, web3WalletAddress } = yield* call([
    authService,
    authService.getWalletAddresses
  ])
  if (!wallet) {
    yield* put(
      fetchAccountFailed({
        reason: 'ACCOUNT_NOT_FOUND'
      })
    )
  }
  const accountData = yield* call(
    userApiFetchSaga.getUserAccount,
    {
      wallet
    },
    true // force refresh to get updated user w handle
  )
  if (!accountData || !accountData?.user) {
    yield* put(
      fetchAccountFailed({
        reason: 'ACCOUNT_NOT_FOUND'
      })
    )
    return
  }
  const user = accountData.user
  if (user.is_deactivated) {
    yield* put(accountActions.resetAccount())
    yield* put(
      fetchAccountFailed({
        reason: 'ACCOUNT_DEACTIVATED'
      })
    )
  }
  // Set the userId in the remoteConfigInstance
  remoteConfigInstance.setUserId(user.user_id)
  yield* call(recordIPIfNotRecent, user.handle)
  // Cache the account and put the signedIn action. We're done.
  yield* call(cacheAccount, accountData)
  const formattedAccount = {
    userId: user.user_id,
    collections: accountData.playlists
  }

  yield* put(fetchAccountSucceeded(formattedAccount))

  // Fetch user's chat blockee and blocker list after fetching their account
  yield* put(fetchBlockees())
  yield* put(fetchBlockers())

  yield* put(
    setWalletAddresses({ currentUser: wallet, web3User: web3WalletAddress })
  )
  // Sync current user info to libs
  const libs = yield* call([
    audiusBackendInstance,
    audiusBackendInstance.getAudiusLibs
  ])
  yield* call([libs, libs.setCurrentUser], {
    wallet,
    userId: user.user_id
  })
  yield* put(signedIn({ account: user, isSignUp }))
}

export function* cacheAccount(account: AccountUserMetadata) {
  const { user: accountUser, playlists: collections } = account
  const localStorage = yield* getContext('localStorage')

  const formattedAccount = {
    userId: accountUser.user_id,
    collections
  }

  yield call([localStorage, 'setAudiusAccount'], formattedAccount)
  yield call([localStorage, 'setAudiusAccountUser'], accountUser)
}

function* recordIPIfNotRecent(handle: string): SagaIterator {
  const identityService = yield* getContext('identityService')
  const localStorage = yield* getContext('localStorage')
  const timeBetweenRefresh = 24 * 60 * 60 * 1000
  const now = Date.now()
  const minAge = now - timeBetweenRefresh
  const storedIPStr = yield* call([localStorage, 'getItem'], IP_STORAGE_KEY)
  const storedIP = storedIPStr && JSON.parse(storedIPStr)
  if (!storedIP || !storedIP[handle] || storedIP[handle].timestamp < minAge) {
    const result = yield* call([identityService, identityService.recordIP])
    if ('userIP' in result) {
      const { userIP } = result
      yield* call(
        [localStorage, 'setItem'],
        IP_STORAGE_KEY,
        JSON.stringify({ ...storedIP, [handle]: { userIP, timestamp: now } })
      )
    }
  }
}

function* associateTwitterAccount(action: ReturnType<typeof twitterLogin>) {
  const { uuid: twitterId, profile } = action.payload
  const identityService = yield* getContext('identityService')
  const reportToSentry = yield* getContext('reportToSentry')
  const userId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  if (!userId || !handle) {
    reportToSentry({
      error: new Error('Missing userId or handle'),
      name: 'Failed to associate Twitter Account',
      additionalInfo: {
        handle,
        userId,
        twitterId
      }
    })
    return
  }

  try {
    yield call(
      [identityService, identityService.associateTwitterUser],
      twitterId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { verified } = profile
    if (account && !account.is_verified && verified) {
      yield put(
        cacheActions.update(Kind.USERS, [
          { id: userId, metadata: { is_verified: true } }
        ])
      )
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(err as string)
    reportToSentry({
      error,
      name: 'Failed to associate Twitter Account',
      additionalInfo: {
        handle,
        userId,
        twitterId
      }
    })
  }
}

function* associateInstagramAccount(action: ReturnType<typeof instagramLogin>) {
  const { uuid: instagramId, profile } = action.payload
  const identityService = yield* getContext('identityService')
  const reportToSentry = yield* getContext('reportToSentry')
  const userId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  if (!userId || !handle) {
    reportToSentry({
      error: new Error('Missing userId or handle'),
      name: 'Failed to associate Instagram Account',
      additionalInfo: {
        handle,
        userId,
        instagramId
      }
    })
    return
  }

  try {
    yield call(
      [identityService, identityService.associateInstagramUser],
      instagramId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { is_verified: verified } = profile
    if (account && !account.is_verified && verified) {
      yield put(
        cacheActions.update(Kind.USERS, [
          { id: userId, metadata: { is_verified: true } }
        ])
      )
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(err as string)
    reportToSentry({
      error,
      name: 'Failed to associate Instagram Account',
      additionalInfo: {
        handle,
        userId,
        instagramId
      }
    })
  }
}

function* associateTikTokAccount(action: ReturnType<typeof tikTokLogin>) {
  const { uuid: tikTokId, profile } = action.payload
  const identityService = yield* getContext('identityService')
  const reportToSentry = yield* getContext('reportToSentry')
  const userId = yield* select(getUserId)
  const handle = yield* select(getUserHandle)
  if (!userId || !handle) {
    reportToSentry({
      error: new Error('Missing userId or handle'),
      name: 'Failed to associate TikTok Account',
      additionalInfo: {
        handle,
        userId,
        tikTokId
      }
    })
    return
  }

  try {
    yield call(
      [identityService, identityService.associateTikTokUser],
      tikTokId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { is_verified: verified } = profile
    if (account && !account.is_verified && verified) {
      yield put(
        cacheActions.update(Kind.USERS, [
          { id: userId, metadata: { is_verified: true } }
        ])
      )
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(err as string)
    reportToSentry({
      error,
      name: 'Failed to associate TikTok Account',
      additionalInfo: {
        handle,
        userId,
        tikTokId
      }
    })
  }
}

function* handleFetchAccount() {
  yield* put(fetchHasTracks())
}

function* handleUploadTrack() {
  yield* put(setHasTracks(true))
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

export function* watchFetchTrackCount() {
  yield* takeLatest(fetchHasTracks, handleFetchTrackCount)
}

export function* watchFetchAccount() {
  yield* takeLatest(fetchAccountSucceeded, handleFetchAccount)
}

export function* watchUploadTrack() {
  yield* takeLatest(UPLOAD_TRACKS_SUCCEEDED, handleUploadTrack)
}

export default function sagas() {
  return [
    watchFetchTrackCount,
    watchFetchAccount,
    watchUploadTrack,
    watchTwitterLogin,
    watchInstagramLogin,
    watchTikTokLogin
  ]
}
