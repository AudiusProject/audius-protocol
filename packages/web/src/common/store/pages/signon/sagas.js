import {
  ELECTRONIC_SUBGENRES,
  FavoriteSource,
  FeatureFlags,
  Genre,
  MAX_HANDLE_LENGTH,
  Name,
  accountActions,
  accountSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  getCityAndRegion,
  getContext,
  processAndCacheUsers,
  settingsPageActions,
  usersSocialActions as socialActions,
  solanaSelectors,
  toastActions,
  confirmerActions,
  confirmTransaction,
  IntKeys,
  parseHandleReservedStatusFromSocial,
  isValidEmailString,
  waitForAccount
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { isEmpty } from 'lodash'
import {
  all,
  call,
  delay,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import { fetchAccountAsync, reCacheAccount } from 'common/store/account/sagas'
import { identify, make } from 'common/store/analytics/actions'
import * as backendActions from 'common/store/backend/actions'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUserByHandle, fetchUsers } from 'common/store/cache/users/sagas'
import { UiErrorCode } from 'store/errors/actions'
import { setHasRequestedBrowserPermission } from 'utils/browserNotifications'
import { restrictedHandles } from 'utils/restrictedHandles'
import { FEED_PAGE, SIGN_IN_PAGE, SIGN_UP_PAGE } from 'utils/route'
import { waitForRead, waitForWrite } from 'utils/sagaHelpers'

import * as signOnActions from './actions'
import { watchSignOnError } from './errorSagas'
import { getRouteOnCompletion, getSignOn } from './selectors'
import { FollowArtistsCategory, Pages } from './types'

const { requestPushNotificationPermissions } = settingsPageActions
const { getFeePayer } = solanaSelectors
const { saveCollection } = collectionsSocialActions
const { getUsers } = cacheUsersSelectors
const getAccountUser = accountSelectors.getAccountUser
const { toast } = toastActions

const SIGN_UP_TIMEOUT_MILLIS = 20 /* min */ * 60 * 1000
const DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS = 5_000

const messages = {
  incompleteAccount:
    'Oops, it looks like your account was never fully completed!',
  emailCheckFailed: 'Something has gone wrong, please try again later.'
}

function* getDefautFollowUserIds() {
  const { ENVIRONMENT } = yield getContext('env')
  // Users ID to filter out of the suggested artists to follow list and to follow by default

  let defaultFollowUserIds = new Set([])

  switch (ENVIRONMENT) {
    case 'production': {
      // user id 51: official audius account
      defaultFollowUserIds = new Set([51])
      break
    }
    case 'staging': {
      // user id 1964: stage testing account
      defaultFollowUserIds = new Set([1964])
      break
    }
  }

  return defaultFollowUserIds
}

export function* fetchSuggestedFollowUserIds() {
  const env = yield getContext('env')
  const res = yield call(fetch, env.SUGGESTED_FOLLOW_HANDLES)
  const json = yield res.json()
  return json
}

const followArtistCategoryGenreMappings = {
  [FollowArtistsCategory.ALL_GENRES]: [],
  [FollowArtistsCategory.ELECTRONIC]: [FollowArtistsCategory.ELECTRONIC].concat(
    Object.keys(ELECTRONIC_SUBGENRES)
  ),
  [FollowArtistsCategory.HIP_HOP_RAP]: [Genre.HIP_HOP_RAP],
  [FollowArtistsCategory.ALTERNATIVE]: [Genre.ALTERNATIVE],
  [FollowArtistsCategory.POP]: [Genre.POP]
}

function* getArtistsToFollow() {
  const users = yield select(getUsers)
  yield put(signOnActions.setUsersToFollow(users))
}

function* fetchDefaultFollowArtists() {
  yield call(waitForRead)
  try {
    const defaultFollowUserIds = yield call(getDefautFollowUserIds)
    yield call(fetchUsers, Array.from(defaultFollowUserIds))
  } catch (e) {
    console.error('Unable to fetch default follow artists', e)
  }
}

function* fetchAllFollowArtist() {
  yield call(waitForRead)
  try {
    // Fetch Featured Follow artists first
    const suggestedUserFollowIds = yield call(fetchSuggestedFollowUserIds)
    yield call(fetchUsers, suggestedUserFollowIds)
    yield put(
      signOnActions.fetchFollowArtistsSucceeded(
        FollowArtistsCategory.FEATURED,
        suggestedUserFollowIds
      )
    )
    yield all(
      Object.keys(followArtistCategoryGenreMappings).map(fetchFollowArtistGenre)
    )
  } catch (e) {
    console.error('Unable to fetch sign up follows', e)
  }
}

function* fetchFollowArtistGenre(followArtistCategory) {
  const apiClient = yield getContext('apiClient')
  const genres = followArtistCategoryGenreMappings[followArtistCategory]
  const defaultFollowUserIds = yield call(getDefautFollowUserIds)
  try {
    const users = yield apiClient.getTopArtistGenres({
      genres,
      limit: 31,
      offset: 0
    })
    const userOptions = users
      .filter((user) => !defaultFollowUserIds.has(user.user_id))
      .slice(0, 30)

    yield call(processAndCacheUsers, userOptions)
    const userIds = userOptions.map(({ user_id: id }) => id)
    yield put(
      signOnActions.fetchFollowArtistsSucceeded(followArtistCategory, userIds)
    )
  } catch (err) {
    yield put(signOnActions.fetchFollowArtistsFailed(err))
  }
}

function* fetchReferrer(action) {
  yield waitForRead()
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const { handle } = action
  if (handle) {
    try {
      const user = yield call(fetchUserByHandle, handle)
      if (!user) return
      yield put(signOnActions.setReferrer(user.user_id))

      // Check if the user is already signed in
      // If so, apply retroactive referrals

      const currentUser = yield select(getAccountUser)
      if (
        currentUser &&
        !currentUser.events?.referrer &&
        currentUser.user_id !== user.user_id
      ) {
        yield call(audiusBackendInstance.updateCreator, {
          ...currentUser,
          events: { referrer: user.user_id }
        })
      }
    } catch (e) {
      console.error(e)
    }
  }
}

const isRestrictedHandle = (handle) =>
  restrictedHandles.has(handle.toLowerCase())
const isHandleCharacterCompliant = (handle) => /^[a-zA-Z0-9_.]*$/.test(handle)

function* validateHandle(action) {
  const { handle, isOauthVerified, onValidate } = action
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const remoteConfigInstance = yield getContext('remoteConfigInstance')
  const { ENVIRONMENT } = yield getContext('env')

  yield call(waitForWrite)
  try {
    if (handle.length > MAX_HANDLE_LENGTH) {
      yield put(signOnActions.validateHandleFailed('tooLong'))
      if (onValidate) onValidate(true)
      return
    } else if (!isHandleCharacterCompliant(handle)) {
      yield put(signOnActions.validateHandleFailed('characters'))
      if (onValidate) onValidate(true)
      return
    } else if (isRestrictedHandle(handle)) {
      yield put(signOnActions.validateHandleFailed('inUse'))
      if (onValidate) onValidate(true)
      return
    }
    yield delay(1000) // Wait 1000ms to debounce user input

    // Call fetch user by handle and do not retry if the user is not created, it will
    // return 404 and force discovery reselection
    const user = yield call(
      fetchUserByHandle,
      handle,
      undefined,
      undefined,
      undefined,
      undefined,
      false
    )
    const handleInUse = !isEmpty(user)
    const handleCheckTimeout =
      remoteConfigInstance.getRemoteVar(
        IntKeys.HANDLE_VERIFICATION_TIMEOUT_MILLIS
      ) ?? DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS

    if (ENVIRONMENT === 'production') {
      const results = yield all([
        remoteConfigInstance.getFeatureEnabled(
          FeatureFlags.VERIFY_HANDLE_WITH_TWITTER
        )
          ? race({
              data: call(audiusBackendInstance.twitterHandle, handle),
              timeout: delay(handleCheckTimeout)
            })
          : null,
        remoteConfigInstance.getFeatureEnabled(
          FeatureFlags.VERIFY_HANDLE_WITH_INSTAGRAM
        )
          ? race({
              data: call(audiusBackendInstance.instagramHandle, handle),
              timeout: delay(handleCheckTimeout)
            })
          : null,
        remoteConfigInstance.getFeatureEnabled(
          FeatureFlags.VERIFY_HANDLE_WITH_TIKTOK
        )
          ? race({
              data: call(audiusBackendInstance.tiktokHandle, handle),
              timeout: delay(handleCheckTimeout)
            })
          : null
      ])

      const [twitterResult, instagramResult, tiktokResult] = results

      const twitterUserQuery = twitterResult?.timeout
        ? null
        : twitterResult?.data
      const instagramUser = instagramResult?.timeout
        ? null
        : instagramResult?.data
      const tikTokUser = tiktokResult?.timeout ? null : tiktokResult?.data

      const handleCheckStatus = parseHandleReservedStatusFromSocial({
        isOauthVerified,
        lookedUpTwitterUser: twitterUserQuery?.user?.profile?.[0] ?? null,
        lookedUpInstagramUser: instagramUser || null,
        lookedUpTikTokUser: tikTokUser || null
      })

      if (handleCheckStatus !== 'notReserved') {
        yield put(signOnActions.validateHandleFailed(handleCheckStatus))
        if (onValidate) onValidate(true)
        return
      }
    }

    if (handleInUse) {
      yield put(signOnActions.validateHandleFailed('inUse'))
      if (onValidate) onValidate(true)
    } else {
      yield put(signOnActions.validateHandleSucceeded())
      if (onValidate) onValidate(false)
    }
  } catch (err) {
    yield put(signOnActions.validateHandleFailed(err.message))
    if (onValidate) onValidate(true)
  }
}

function* checkEmail(action) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  if (!isValidEmailString(action.email)) {
    yield put(signOnActions.validateEmailFailed('characters'))
    return
  }

  try {
    const inUse = yield call(audiusBackendInstance.emailInUse, action.email)
    if (inUse) {
      yield put(signOnActions.goToPage(Pages.SIGNIN))
      // let mobile client know that email is in use
      yield put(signOnActions.validateEmailSucceeded(false))
      if (action.onUnavailable) {
        yield call(action.onUnavailable)
      }
    } else {
      const trackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_EMAIL, {
        emailAddress: action.email
      })
      yield put(trackEvent)
      yield put(signOnActions.validateEmailSucceeded(true))
      yield put(signOnActions.goToPage(Pages.PASSWORD))
      if (action.onAvailable) {
        yield call(action.onAvailable)
      }
    }
  } catch (err) {
    yield put(toast({ content: messages.emailCheckFailed }))
    if (action.onError) {
      yield call(action.onError)
    }
  }
}

function* validateEmail(action) {
  if (!isValidEmailString(action.email)) {
    yield put(signOnActions.validateEmailFailed('characters'))
  } else {
    yield put(signOnActions.validateEmailSucceeded(true))
  }
}

function* signUp() {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const { waitForRemoteConfig } = yield getContext('remoteConfigInstance')
  const getFeatureEnabled = yield getContext('getFeatureEnabled')

  yield call(waitForWrite)

  const signOn = yield select(getSignOn)
  const location = yield call(getCityAndRegion)
  const name = signOn.name.value.trim()
  const email = signOn.email.value
  const password = signOn.password.value
  const handle = signOn.handle.value
  const alreadyExisted = signOn.accountAlreadyExisted
  const referrer = signOn.referrer
  const createUserMetadata = {
    name,
    handle,
    profilePicture: signOn.profileImage?.file || null,
    coverPhoto: signOn.coverPhoto?.file || null,
    isVerified: signOn.verified,
    location
  }

  yield call(audiusBackendInstance.setUserHandleForRelay, handle)

  const feePayerOverride = yield select(getFeePayer)

  yield put(
    confirmerActions.requestConfirmation(
      handle,
      function* () {
        const { blockHash, blockNumber, userId, error, errorStatus, phase } =
          yield call(audiusBackendInstance.signUp, {
            email,
            password,
            formFields: createUserMetadata,
            hasWallet: alreadyExisted,
            referrer,
            feePayerOverride
          })

        if (error) {
          // We are including 0 status code here to indicate rate limit,
          // which appears to be happening for some devices.
          const rateLimited = errorStatus === 429 || errorStatus === 0
          const blocked = errorStatus === 403
          const params = {
            error,
            phase,
            shouldReport: !rateLimited && !blocked,
            shouldToast: rateLimited
          }
          if (rateLimited) {
            params.message = 'Please try again later'
            yield put(
              make(Name.CREATE_ACCOUNT_RATE_LIMIT, {
                handle,
                email,
                location
              })
            )
          }
          if (blocked) {
            params.message = 'User was blocked'
            params.uiErrorCode = UiErrorCode.RELAY_BLOCKED
            yield put(
              make(Name.CREATE_ACCOUNT_BLOCKED, {
                handle,
                email,
                location
              })
            )
          }
          yield put(signOnActions.signUpFailed(params))
          return
        }

        if (!signOn.useMetaMask && signOn.twitterId) {
          const { error } = yield call(
            audiusBackendInstance.associateTwitterAccount,
            signOn.twitterId,
            userId,
            handle
          )
          if (error) {
            yield put(signOnActions.setTwitterProfileError(error))
          }
        }
        if (!signOn.useMetaMask && signOn.instagramId) {
          const { error } = yield call(
            audiusBackendInstance.associateInstagramAccount,
            signOn.instagramId,
            userId,
            handle
          )
          if (error) {
            yield put(signOnActions.setInstagramProfileError(error))
          }
        }

        if (!signOn.useMetaMask && signOn.tikTokId) {
          const { error } = yield call(
            audiusBackendInstance.associateTikTokAccount,
            signOn.tikTokId,
            userId,
            handle
          )
          if (error) {
            yield put(signOnActions.setTikTokProfileError(error))
          }
        }

        yield put(
          identify(handle, {
            name,
            email,
            userId
          })
        )

        yield put(signOnActions.signUpSucceededWithId(userId))

        const isNativeMobile = yield getContext('isNativeMobile')
        if (isNativeMobile) {
          yield put(requestPushNotificationPermissions())
        } else {
          // Set the has request browser permission to true as the signon provider will open it
          setHasRequestedBrowserPermission()
        }

        yield call(waitForRemoteConfig)

        // Check feature flag to disable confirmation
        const disableSignUpConfirmation = yield call(
          getFeatureEnabled,
          FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION
        )

        if (!disableSignUpConfirmation) {
          const confirmed = yield call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(`Could not confirm sign up for user id ${userId}`)
          }
        }
      },
      function* () {
        yield put(signOnActions.sendWelcomeEmail(name))
        yield call(fetchAccountAsync, { isSignUp: true })
        yield put(signOnActions.followArtists())
        yield put(signOnActions.signUpSucceeded())
      },
      function* ({ timeout }) {
        if (timeout) {
          console.debug('Timed out trying to register')
          yield put(signOnActions.signUpTimeout())
        }
      },
      () => {},
      SIGN_UP_TIMEOUT_MILLIS
    )
  )
}

/**
 * Repairs broken signups from #flare-206
 */
function* repairSignUp() {
  try {
    const audiusBackendInstance = yield getContext('audiusBackendInstance')
    yield call(waitForAccount)
    const audiusLibs = yield call([
      audiusBackendInstance,
      audiusBackendInstance.getAudiusLibs
    ])

    // Need at least a name, handle, and wallet to repair
    const metadata = yield select(getAccountUser)
    if (!metadata || !(metadata.name && metadata.handle && metadata.wallet)) {
      return
    }

    const User = audiusLibs.User
    const dnUser = yield call(
      [User, User.getUsers],
      1, // limit
      0, // offset
      [metadata.user_id], // userIds
      null, // walletAddress
      null, // handle
      null // minBlockNumber
    )
    if (dnUser && dnUser.length > 0) {
      return
    }
    yield put(
      confirmerActions.requestConfirmation(
        metadata.handle,
        function* () {
          console.info('Repairing user')
          yield put(make(Name.SIGN_UP_REPAIR_START))
          yield call([User, User.repairEntityManagerUserV2], metadata)
        },
        function* () {
          console.info('Successfully repaired user')
          yield put(make(Name.SIGN_UP_REPAIR_SUCCESS))
          yield put(signOnActions.sendWelcomeEmail(metadata.name))
          yield call(fetchAccountAsync, { isSignUp: true })
        },
        function* ({ timeout }) {
          console.error('Failed to repair user')
          yield put(Name.SIGN_UP_REPAIR_FAILURE)
          if (timeout) {
            console.debug('Timed out trying to fix registration')
            yield put(signOnActions.signUpTimeout())
          }
        },
        () => {},
        SIGN_UP_TIMEOUT_MILLIS
      )
    )
  } catch (e) {
    console.error('Failed to repair account', e)
  }
}

function* signIn(action) {
  const { email, password, otp } = action
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield call(waitForRead)
  try {
    const signOn = yield select(getSignOn)
    const signInResponse = yield call(
      audiusBackendInstance.signIn,
      email ?? signOn.email.value,
      password ?? signOn.password.value,
      otp ?? signOn.otp.value
    )
    if (
      !signInResponse.error &&
      signInResponse.user &&
      signInResponse.user.name
    ) {
      yield put(accountActions.fetchAccount())
      yield put(signOnActions.signInSucceeded())
      const route = yield select(getRouteOnCompletion)

      // NOTE: Wait on the account success before recording the signin event so that the user account is
      // populated in the store
      const { failure } = yield race({
        success: take(accountActions.fetchAccountSucceeded.type),
        failure: take(accountActions.fetchAccountFailed)
      })
      if (failure) {
        yield put(
          signOnActions.signInFailed(
            "Couldn't get account",
            failure.payload.reason,
            failure.payload.reason === 'ACCOUNT_DEACTIVATED'
          )
        )
        const trackEvent = make(Name.SIGN_IN_FINISH, {
          status: 'fetch account failed'
        })
        yield put(trackEvent)
        return
      }

      // Apply retroactive referral
      if (!signInResponse.user?.events?.referrer && signOn.referrer) {
        yield fork(audiusBackendInstance.updateCreator, {
          ...signInResponse.user,
          events: { referrer: signOn.referrer }
        })
      }

      yield put(pushRoute(route || FEED_PAGE))

      const trackEvent = make(Name.SIGN_IN_FINISH, { status: 'success' })
      yield put(trackEvent)

      // Reset the sign on in the background after page load as to relieve the UI loading
      yield delay(1000)
      yield put(signOnActions.resetSignOn())
      const isNativeMobile = yield getContext('isNativeMobile')
      if (isNativeMobile) {
        yield put(requestPushNotificationPermissions())
      } else {
        setHasRequestedBrowserPermission()
        yield put(accountActions.showPushNotificationConfirmation())
      }
    } else if (
      !signInResponse.error &&
      signInResponse.user &&
      !signInResponse.user.name
    ) {
      // Go to sign up flow because the account is incomplete
      yield put(
        signOnActions.openSignOn(false, Pages.PROFILE, {
          accountAlreadyExisted: true,
          handle: {
            value: signInResponse.user.handle,
            status: 'disabled'
          }
        })
      )
      yield put(signOnActions.showToast(messages.incompleteAccount))

      const trackEvent = make(Name.SIGN_IN_WITH_INCOMPLETE_ACCOUNT, {
        handle: signInResponse.handle
      })
      yield put(trackEvent)
    } else if (signInResponse.error && signInResponse.phase === 'FIND_USER') {
      // Go to sign up flow because the account is incomplete
      yield put(
        signOnActions.openSignOn(false, Pages.PROFILE, {
          accountAlreadyExisted: true
        })
      )
      yield put(signOnActions.showToast(messages.incompleteAccount))
    } else {
      yield put(
        signOnActions.signInFailed(
          signInResponse.error,
          signInResponse.phase,
          false
        )
      )
      const trackEvent = make(Name.SIGN_IN_FINISH, {
        status: 'invalid credentials'
      })
      yield put(trackEvent)
    }
  } catch (err) {
    yield put(signOnActions.signInFailed(err))
  }
}

function* followCollections(collectionIds, favoriteSource) {
  yield call(waitForWrite)
  try {
    const result = yield call(retrieveCollections, collectionIds)

    for (let i = 0; i < collectionIds.length; i++) {
      const id = collectionIds[i]
      if (result?.collections?.[id]) {
        yield put(saveCollection(id, favoriteSource))
      }
    }
  } catch (err) {
    console.error({ err })
  }
}

function* followArtists() {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const { ENVIRONMENT } = yield getContext('env')
  const defaultFollowUserIds = yield call(getDefautFollowUserIds)
  yield call(waitForWrite)
  try {
    // Auto-follow Hot & New Playlist
    if (ENVIRONMENT === 'production') {
      yield fork(followCollections, [4281], FavoriteSource.SIGN_UP)
    } else if (ENVIRONMENT === 'staging') {
      yield fork(followCollections, [555], FavoriteSource.SIGN_UP)
    }

    const signOn = yield select(getSignOn)
    const referrer = signOn.referrer

    const {
      followArtists: { selectedUserIds }
    } = signOn
    const userIdsToFollow = [
      ...new Set([
        ...defaultFollowUserIds,
        ...selectedUserIds,
        ...(referrer == null ? [] : [referrer])
      ])
    ]
    for (const userId of userIdsToFollow) {
      yield put(socialActions.followUser(userId))
    }
    const hasFollowConfirmed = userIdsToFollow.map(() => false)
    while (!hasFollowConfirmed.every(Boolean)) {
      const { success, failed } = yield race({
        success: take(socialActions.FOLLOW_USER_SUCCEEDED),
        failed: take(socialActions.FOLLOW_USER_FAILED)
      })
      const { userId } = success || failed
      const userIndex = userIdsToFollow.findIndex((fId) => fId === userId)
      if (userIndex > -1) hasFollowConfirmed[userIndex] = true
    }

    // Reload feed is in view
    yield put(signOnActions.setAccountReady())
    // The update user location depends on the user being discoverable in discprov
    // So we wait until both the user is indexed and the follow user actions are finished
    yield call(audiusBackendInstance.updateUserLocationTimezone)

    // Re-cache the account here (in local storage). This is to make sure that the follows are
    // persisted across the next refresh of the client. Initially the user is pulled in from
    // local storage before we get any response back from a discovery node.
    yield call(reCacheAccount)
  } catch (err) {
    console.error({ err })
  }
}

function* configureMetaMask() {
  try {
    window.localStorage.setItem('useMetaMask', JSON.stringify(true))
    yield put(backendActions.setupBackend())
  } catch (err) {
    console.error({ err })
  }
}

function* watchGetArtistsToFollow() {
  yield takeEvery(signOnActions.GET_USERS_TO_FOLLOW, getArtistsToFollow)
}

function* watchFetchAllFollowArtists() {
  yield takeEvery(signOnActions.FETCH_ALL_FOLLOW_ARTISTS, fetchAllFollowArtist)
}

function* watchFetchReferrer() {
  yield takeLatest(signOnActions.FETCH_REFERRER, fetchReferrer)
}

function* watchCheckEmail() {
  yield takeLatest(signOnActions.CHECK_EMAIL, checkEmail)
}

function* watchValidateEmail() {
  yield takeLatest(signOnActions.VALIDATE_EMAIL, validateEmail)
}

function* watchValidateHandle() {
  yield takeLatest(signOnActions.VALIDATE_HANDLE, validateHandle)
}

function* watchSignUp() {
  yield takeLatest(signOnActions.SIGN_UP, function* (action) {
    // Fetch the default follow artists in parallel so that we don't have to block on this later (thus adding perceived sign up time) in the follow artists step.
    yield fork(fetchDefaultFollowArtists)
    yield signUp(action)
  })
}

function* watchSignIn() {
  yield takeLatest(signOnActions.SIGN_IN, signIn)
}

function* watchConfigureMetaMask() {
  yield takeLatest(signOnActions.CONFIGURE_META_MASK, configureMetaMask)
}

function* watchFollowArtists() {
  yield takeLatest(signOnActions.FOLLOW_ARTISTS, followArtists)
}

function* watchShowToast() {
  yield takeLatest(signOnActions.SET_TOAST, function* (action) {
    if (action.text) {
      yield delay(5000)
      yield put(signOnActions.clearToast())
    }
  })
}

function* watchOpenSignOn() {
  yield takeLatest(signOnActions.OPEN_SIGN_ON, function* (action) {
    const route = action.signIn ? SIGN_IN_PAGE : SIGN_UP_PAGE
    yield put(pushRoute(route))
  })
}

function* watchSendWelcomeEmail() {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield takeLatest(signOnActions.SEND_WELCOME_EMAIL, function* (action) {
    yield call(audiusBackendInstance.sendWelcomeEmail, {
      name: action.name
    })
  })
}

export default function sagas() {
  const sagas = [
    watchFetchAllFollowArtists,
    watchFetchReferrer,
    watchCheckEmail,
    watchValidateEmail,
    watchValidateHandle,
    watchSignUp,
    watchSignIn,
    watchFollowArtists,
    watchGetArtistsToFollow,
    watchConfigureMetaMask,
    watchShowToast,
    watchOpenSignOn,
    watchSignOnError,
    watchSendWelcomeEmail,
    repairSignUp
  ]
  return sagas
}
