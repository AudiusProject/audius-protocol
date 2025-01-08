import { SagaIterator } from 'redux-saga'
import {
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga'

import { userApiFetchSaga } from '~/api/user'
import {
  AccountUserMetadata,
  ErrorLevel,
  Id,
  Kind,
  Status,
  UserMetadata
} from '~/models'
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
import { fetchProfile } from '../pages/profile/actions'
import { getSDK } from '../sdkUtils'

import {
  fetchAccount,
  fetchAccountFailed,
  fetchAccountSucceeded,
  fetchHasTracks,
  fetchLocalAccount,
  instagramLogin,
  resetAccount,
  setHasTracks,
  setWalletAddresses,
  showPushNotificationConfirmation,
  signedIn,
  tikTokLogin,
  twitterLogin
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

function* handleUploadTrack() {
  yield* put(setHasTracks(true))
}

/**
 * Sets the sentry user so that alerts are tied to a user
 */
function* setSentryUser(
  user: Pick<UserMetadata, 'user_id' | 'handle'>,
  traits: Record<string, unknown>
) {
  const sentry = yield* getContext('sentry')
  if (traits.isVerified) {
    sentry.setTag('isVerified', `${traits.isVerified}`)
  }
  if (traits.managerUserId) {
    sentry.setTag('isManagerMode', 'true')
  }
  const scope = sentry.getCurrentScope()
  scope.setUser({
    id: `${user.user_id}`,
    username: user.handle,
    ...traits
  })
}

function* initializeMetricsForUser({
  accountUser
}: {
  accountUser: UserMetadata
}) {
  const authService = yield* getContext('authService')
  const solanaWalletService = yield* getContext('solanaWalletService')
  const analytics = yield* getContext('analytics')

  if (accountUser && accountUser.handle) {
    const { web3WalletAddress } = yield* call([
      authService,
      authService.getWalletAddresses
    ])
    const { user: web3User } = yield* call(userApiFetchSaga.getUserAccount, {
      wallet: web3WalletAddress
    })

    let solanaWallet
    let managerUserId
    let managerHandle

    // If operating as a managed account, identify the manager user id
    if (web3User && web3User.user_id !== accountUser.user_id) {
      managerUserId = web3User.user_id
      managerHandle = web3User.handle
    } else {
      // If not a managed account, identify the Solana wallet associated with
      // the hedgehog wallet
      try {
        const keypair = yield* call([
          solanaWalletService,
          solanaWalletService.getKeypair
        ])
        if (!keypair) {
          throw new Error('No keypair found')
        }
        solanaWallet = keypair.publicKey.toBase58()
      } catch (e) {
        console.error('Failed to fetch Solana root wallet during identify()', e)
      }
    }

    const traits = {
      isVerified: accountUser.is_verified,
      trackCount: accountUser.track_count,
      managerHandle,
      managerUserId,
      solanaWallet
    }

    yield* call([analytics, analytics.identify], accountUser.handle, traits)
    yield* call(setSentryUser, accountUser, traits)
  }
}

export function* fetchAccountAsync() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const authService = yield* getContext('authService')
  const localStorage = yield* getContext('localStorage')
  const sdk = yield* getSDK()
  const accountStatus = yield* select(accountSelectors.getAccountStatus)
  // Don't revert successful local account fetch
  if (accountStatus !== Status.SUCCESS) {
    yield* put(accountActions.fetchAccountRequested())
  }

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
    return
  }
  const accountData: AccountUserMetadata | undefined = yield* call(
    userApiFetchSaga.getUserAccount,
    {
      wallet
    },
    true // force refresh to get updated user w handle
  )

  if (!accountData) {
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

  if (accountData?.user?.metadata_multihash) {
    const { data: accountCidData } = yield* call(
      [sdk.full.cidData, sdk.full.cidData.getMetadata],
      {
        metadataId: accountData?.user?.metadata_multihash
      }
    )
    // @ts-expect-error type of accountCidData is opaque
    accountData.user = {
      ...accountData.user,
      ...(accountCidData?.data ?? {})
    }
  }

  const guestEmailFromLocalStorage = yield* call(
    [localStorage, 'getItem'],
    'guestEmail'
  )
  const guestEmail = guestEmailFromLocalStorage
    ? JSON.parse(guestEmailFromLocalStorage)
    : null

  // Set the userId in the remoteConfigInstance
  remoteConfigInstance.setUserId(user.user_id)

  if (user.handle) {
    // guest account don't have handles
    yield* call(recordIPIfNotRecent, user.handle)
  }

  // Cache the account and put the signedIn action. We're done.
  yield* call(cacheAccount, accountData)
  const formattedAccount = {
    userId: user.user_id,
    collections: accountData.playlists,
    guestEmail
  }
  yield* put(fetchAccountSucceeded(formattedAccount))

  // Fetch user's chat blockee and blocker list after fetching their account
  yield* put(fetchBlockees())
  yield* put(fetchBlockers())

  yield* put(
    setWalletAddresses({ currentUser: wallet, web3User: web3WalletAddress })
  )

  try {
    yield* call(initializeMetricsForUser, { accountUser: user })
  } catch (e) {
    console.error('Failed to initialize metrics for user', e)
  }

  yield* put(showPushNotificationConfirmation())

  yield* fork(audiusBackendInstance.updateUserLocationTimezone, { sdk })

  // Fetch the profile so we get everything we need to populate
  // the left nav / other site-wide metadata.
  yield* put(fetchProfile(user.handle, user.user_id, false, false, false, true))

  yield* put(signedIn({ account: user }))
}

function* fetchLocalAccountAsync() {
  const localStorage = yield* getContext('localStorage')

  yield* put(accountActions.fetchAccountRequested())

  const cachedAccount = yield* call([
    localStorage,
    localStorage.getAudiusAccount
  ])
  const cachedAccountUser = yield* call([
    localStorage,
    localStorage.getAudiusAccountUser
  ])

  if (cachedAccount && cachedAccountUser && !cachedAccountUser.is_deactivated) {
    yield* put(
      cacheActions.add(Kind.USERS, [
        {
          id: cachedAccountUser.user_id,
          uid: 'USER_ACCOUNT',
          metadata: cachedAccountUser
        }
      ])
    )

    yield* put(fetchAccountSucceeded(cachedAccount))
  } else {
    yield* put(fetchAccountFailed({ reason: 'ACCOUNT_NOT_FOUND_LOCAL' }))
  }
}

export function* cacheAccount(
  account: AccountUserMetadata & { guestEmail?: string | null }
) {
  const { user: accountUser, playlists: collections, guestEmail } = account
  const localStorage = yield* getContext('localStorage')

  const formattedAccount = {
    userId: accountUser.user_id,
    collections,
    guestEmail
  }

  yield* call([localStorage, localStorage.setAudiusAccount], formattedAccount)
  yield* call([localStorage, localStorage.setAudiusAccountUser], accountUser)
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
    yield* call(
      [identityService, identityService.associateTwitterUser],
      twitterId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { verified } = profile
    if (account && !account.is_verified && verified) {
      yield* put(
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
    yield* call(
      [identityService, identityService.associateInstagramUser],
      instagramId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { is_verified: verified } = profile
    if (account && !account.is_verified && verified) {
      yield* put(
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
    yield* call(
      [identityService, identityService.associateTikTokUser],
      tikTokId,
      userId,
      handle
    )

    const account = yield* select(getAccountUser)
    const { is_verified: verified } = profile
    if (account && !account.is_verified && verified) {
      yield* put(
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

function* handleFetchAccountSucceeded() {
  yield* put(fetchHasTracks())
}

function* watchFetchAccount() {
  yield* takeEvery(fetchAccount.type, fetchAccountAsync)
}

function* watchFetchAccountFailed() {
  yield* takeEvery(
    accountActions.fetchAccountFailed.type,
    function* (action: ReturnType<typeof accountActions.fetchAccountFailed>) {
      const userId = yield* select(getUserId)
      const reportToSentry = yield* getContext('reportToSentry')
      if (userId) {
        yield* call(reportToSentry, {
          level: ErrorLevel.Error,
          error: new Error(`Fetch account failed: ${action.payload.reason}`),
          additionalInfo: { userId }
        })
      }
    }
  )
}

function* watchFetchLocalAccount() {
  yield* takeEvery(fetchLocalAccount.type, fetchLocalAccountAsync)
}

function* watchResetAccount() {
  yield* takeEvery(resetAccount.type, function* () {
    const localStorage = yield* getContext('localStorage')
    yield* call([localStorage, localStorage.clearAudiusAccount])
    yield* call([localStorage, localStorage.clearAudiusAccountUser])
  })
}

function* watchTwitterLogin() {
  yield* takeEvery(twitterLogin.type, associateTwitterAccount)
}

function* watchInstagramLogin() {
  yield* takeEvery(instagramLogin.type, associateInstagramAccount)
}

function* watchTikTokLogin() {
  yield* takeEvery(tikTokLogin.type, associateTikTokAccount)
}

export function* watchFetchTrackCount() {
  yield* takeLatest(fetchHasTracks, handleFetchTrackCount)
}

export function* watchFetchAccountSucceeded() {
  yield* takeLatest(fetchAccountSucceeded, handleFetchAccountSucceeded)
}

export function* watchUploadTrack() {
  yield* takeLatest(UPLOAD_TRACKS_SUCCEEDED, handleUploadTrack)
}

export default function sagas() {
  return [
    watchFetchAccount,
    watchFetchAccountFailed,
    watchFetchAccountSucceeded,
    watchFetchLocalAccount,
    watchFetchTrackCount,
    watchInstagramLogin,
    watchResetAccount,
    watchTikTokLogin,
    watchTwitterLogin,
    watchUploadTrack
  ]
}
