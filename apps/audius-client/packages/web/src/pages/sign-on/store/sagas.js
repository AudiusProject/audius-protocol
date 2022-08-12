import {
  FavoriteSource,
  Name,
  FeatureFlags,
  IntKeys,
  StringKeys
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import {
  all,
  call,
  delay,
  fork,
  getContext,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import { fetchAccountAsync, reCacheAccount } from 'common/store/account/sagas'
import { getAccountUser } from 'common/store/account/selectors'
import * as backendActions from 'common/store/backend/actions'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUserByHandle, fetchUsers } from 'common/store/cache/users/sagas'
import { getUsers } from 'common/store/cache/users/selectors'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import { saveCollection } from 'common/store/social/collections/actions'
import * as socialActions from 'common/store/social/users/actions'
import { getFeePayer } from 'common/store/solana/selectors'
import { ELECTRONIC_SUBGENRES, Genre } from 'common/utils/genres'
import { getIGUserUrl } from 'components/instagram-auth/InstagramAuth'
import { getCityAndRegion } from 'services/Location'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { identify, make } from 'store/analytics/actions'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { setHasRequestedBrowserPermission } from 'utils/browserNotifications'
import { isValidEmailString } from 'utils/email'
import { withTimeout } from 'utils/network'
import { restrictedHandles } from 'utils/restrictedHandles'
import { ERROR_PAGE, FEED_PAGE, SIGN_IN_PAGE, SIGN_UP_PAGE } from 'utils/route'

import { MAX_HANDLE_LENGTH } from '../utils/formatSocialProfile'

import * as signOnActions from './actions'
import { watchSignOnError } from './errorSagas'
import mobileSagas from './mobileSagas'
import { getRouteOnCompletion, getSignOn } from './selectors'
import { FollowArtistsCategory, Pages } from './types'
import { checkHandle } from './verifiedChecker'

const { waitForRemoteConfig } = remoteConfigInstance

const IS_PRODUCTION_BUILD = process.env.NODE_ENV === 'production'
const IS_PRODUCTION = process.env.REACT_APP_ENVIRONMENT === 'production'
const IS_STAGING = process.env.REACT_APP_ENVIRONMENT === 'staging'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const SUGGESTED_FOLLOW_USER_HANDLE_URL =
  process.env.REACT_APP_SUGGESTED_FOLLOW_HANDLES
const SIGN_UP_TIMEOUT_MILLIS = 20 /* min */ * 60 * 1000

const messages = {
  incompleteAccount:
    'Oops, it looks like your account was never fully completed!'
}

// Users ID to filter out of the suggested artists to follow list and to follow by default
let defaultFollowUserIds = new Set([])
if (IS_PRODUCTION) {
  // user id 51: official audius account
  defaultFollowUserIds = new Set([51])
} else if (IS_STAGING) {
  // user id 1964: stage testing account
  defaultFollowUserIds = new Set([1964])
}

export const fetchSuggestedFollowUserIds = async () => {
  return fetch(SUGGESTED_FOLLOW_USER_HANDLE_URL).then((d) => d.json())
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

function* fetchAllFollowArtist() {
  yield call(waitForBackendSetup)
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
const isHandleCharacterCompliant = (handle) => /^[a-zA-Z0-9_]*$/.test(handle)

async function getInstagramUser(handle) {
  try {
    const profileEndpoint =
      remoteConfigInstance.getRemoteVar(StringKeys.INSTAGRAM_API_PROFILE_URL) ||
      'https://instagram.com/$USERNAME$/?__a=1'
    const timeout =
      remoteConfigInstance.getRemoteVar(
        IntKeys.INSTAGRAM_HANDLE_CHECK_TIMEOUT
      ) || 4000
    const fetchIGUserUrl = getIGUserUrl(profileEndpoint, handle)
    const igProfile = await withTimeout(fetch(fetchIGUserUrl), timeout)
    if (!igProfile.ok) return null
    const igProfileJson = await igProfile.json()
    if (!igProfileJson.graphql || !igProfileJson.graphql.user) {
      return null
    }
    const fields = ['username', 'is_verified']
    return fields.reduce((profile, field) => {
      profile[field] = igProfileJson.graphql.user[field]
      return profile
    }, {})
  } catch (err) {
    return null
  }
}

function* validateHandle(action) {
  const { handle, isOauthVerified, onValidate } = action
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield call(waitForBackendSetup)
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
    yield delay(300) // Wait 300 ms to debounce user input

    let handleInUse
    if (IS_PRODUCTION_BUILD || IS_PRODUCTION) {
      const [inUse, twitterUserQuery, instagramUser] = yield all([
        call(audiusBackendInstance.handleInUse, handle),
        call(audiusBackendInstance.twitterHandle, handle),
        call(getInstagramUser, handle)
      ])
      const handleCheckStatus = checkHandle(
        isOauthVerified,
        twitterUserQuery?.user?.profile?.[0] ?? null,
        instagramUser || null
      )

      if (handleCheckStatus !== 'notReserved') {
        yield put(signOnActions.validateHandleFailed(handleCheckStatus))
        if (onValidate) onValidate(true)
        return
      }
      handleInUse = inUse
    } else {
      handleInUse = yield call(audiusBackendInstance.handleInUse, handle)
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
    } else {
      const trackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_EMAIL, {
        emailAddress: action.email
      })
      yield put(trackEvent)
      yield put(signOnActions.validateEmailSucceeded(true))
      yield put(signOnActions.goToPage(Pages.PASSWORD))
    }
  } catch (err) {
    yield put(signOnActions.validateEmailFailed(err.message))
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
  yield call(waitForBackendSetup)
  const signOn = yield select(getSignOn)
  const location = yield call(getCityAndRegion)
  const createUserMetadata = {
    name: signOn.name.value,
    handle: signOn.handle.value,
    profilePicture: (signOn.profileImage && signOn.profileImage.file) || null,
    coverPhoto: (signOn.coverPhoto && signOn.coverPhoto.file) || null,
    isVerified: signOn.verified,
    location
  }
  const name = signOn.name.value
  const email = signOn.email.value
  const password = signOn.password.value
  const handle = signOn.handle.value
  const alreadyExisted = signOn.accountAlreadyExisted
  const referrer = signOn.referrer

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
          const params = {
            error,
            phase,
            redirectRoute: rateLimited ? SIGN_UP_PAGE : ERROR_PAGE,
            shouldReport: !rateLimited,
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
        if (
          !signOn.useMetaMask &&
          signOn.instagramId &&
          handle.toLowerCase() ===
            (signOn.instagramScreenName || '').toLowerCase()
        ) {
          const { error } = yield call(
            audiusBackendInstance.associateInstagramAccount,
            handle.toLowerCase(),
            userId,
            handle
          )
          if (error) {
            yield put(signOnActions.setInstagramProfileError(error))
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

        // Set the has request browser permission to true as the signon provider will open it
        setHasRequestedBrowserPermission()

        yield call(waitForRemoteConfig)

        // Check feature flag to disable confirmation
        if (!getFeatureEnabled(FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION)) {
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
        yield put(signOnActions.signUpSucceeded())
        yield call(fetchAccountAsync)
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

function* signIn(action) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield call(waitForBackendSetup)
  try {
    const signOn = yield select(getSignOn)
    const signInResponse = yield call(
      audiusBackendInstance.signIn,
      signOn.email.value,
      signOn.password.value
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
      setHasRequestedBrowserPermission()
      yield put(accountActions.showPushNotificationConfirmation())
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
  yield call(waitForBackendSetup)
  try {
    const result = yield retrieveCollections(null, collectionIds)

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
  yield call(waitForBackendSetup)
  try {
    // Auto-follow Hot & New Playlist
    if (IS_PRODUCTION) {
      yield fork(followCollections, [4281], FavoriteSource.SIGN_UP)
    } else if (IS_STAGING) {
      yield fork(followCollections, [555], FavoriteSource.SIGN_UP)
    }

    const signOn = yield select(getSignOn)
    const {
      followArtists: { selectedUserIds }
    } = signOn
    const userIdsToFollow = [
      ...new Set([...defaultFollowUserIds, ...selectedUserIds])
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
  yield takeLatest(signOnActions.SIGN_UP, signUp)
}

function* watchSignIn() {
  yield takeLatest(signOnActions.SIGN_IN, signIn)
}

function* watchConfigureMetaMask() {
  yield takeLatest(signOnActions.CONFIGURE_META_MASK, configureMetaMask)
}

function* watchFollowArtists() {
  while (
    yield all([
      take(signOnActions.SIGN_UP_SUCCEEDED),
      take(accountActions.fetchAccountSucceeded.type),
      take(signOnActions.FOLLOW_ARTISTS)
    ])
  ) {
    yield call(followArtists)
  }
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
    watchSendWelcomeEmail
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
