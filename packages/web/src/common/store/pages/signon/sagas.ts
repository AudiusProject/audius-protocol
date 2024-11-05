import {
  userMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { userApiFetchSaga } from '@audius/common/api'
import {
  Name,
  FavoriteSource,
  ID,
  FollowSource,
  UserMetadata,
  ErrorLevel,
  InstagramUser,
  TikTokUser,
  AccountUserMetadata
} from '@audius/common/models'
import {
  IntKeys,
  FeatureFlags,
  MAX_HANDLE_LENGTH,
  getCityAndRegion,
  SignInResponse
} from '@audius/common/services'
import {
  accountActions,
  accountSelectors,
  processAndCacheUsers,
  cacheUsersSelectors,
  settingsPageActions,
  collectionsSocialActions,
  usersSocialActions as socialActions,
  solanaSelectors,
  toastActions,
  getContext,
  confirmerActions,
  confirmTransaction,
  getSDK
} from '@audius/common/store'
import {
  Genre,
  ELECTRONIC_SUBGENRES,
  waitForAccount,
  parseHandleReservedStatusFromSocial,
  isValidEmailString,
  route
} from '@audius/common/utils'
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
} from 'typed-redux-saga'

import { fetchAccountAsync, reCacheAccount } from 'common/store/account/sagas'
import { identify, make } from 'common/store/analytics/actions'
import * as backendActions from 'common/store/backend/actions'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { fetchUserByHandle, fetchUsers } from 'common/store/cache/users/sagas'
import { UiErrorCode } from 'store/errors/actions'
import { setHasRequestedBrowserPermission } from 'utils/browserNotifications'
import { restrictedHandles } from 'utils/restrictedHandles'
import { waitForRead, waitForWrite } from 'utils/sagaHelpers'

import * as signOnActions from './actions'
import { watchSignOnError } from './errorSagas'
import { getRouteOnCompletion, getSignOn } from './selectors'
import { FollowArtistsCategory, Pages } from './types'

const { FEED_PAGE, SIGN_IN_PAGE, SIGN_UP_PAGE } = route
const { requestPushNotificationPermissions } = settingsPageActions
const { getFeePayer } = solanaSelectors
const { saveCollection } = collectionsSocialActions
const { getUsers } = cacheUsersSelectors
const { getAccountUser, getHasAccount } = accountSelectors
const { toast } = toastActions

const SIGN_UP_TIMEOUT_MILLIS = 20 /* min */ * 60 * 1000
const DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS = 5_000

const messages = {
  incompleteAccount:
    'Oops, it looks like your account was never fully completed!',
  emailCheckFailed: 'Something has gone wrong, please try again later.'
}

function* getDefautFollowUserIds() {
  const { ENVIRONMENT } = yield* getContext('env')
  // Users ID to filter out of the suggested artists to follow list and to follow by default

  let defaultFollowUserIds: Set<number> = new Set([])

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
  const env = yield* getContext('env')
  const res = yield* call(fetch, env.SUGGESTED_FOLLOW_HANDLES)
  const json = yield* call([res, res.json])
  return json
}

type SelectableArtistCategory = Exclude<
  FollowArtistsCategory,
  FollowArtistsCategory.FEATURED
>

const followArtistCategoryGenreMappings: Record<
  SelectableArtistCategory,
  Genre[]
> = {
  [FollowArtistsCategory.ALL_GENRES]: [],
  [FollowArtistsCategory.ELECTRONIC]: [Genre.ELECTRONIC].concat(
    Object.keys(ELECTRONIC_SUBGENRES) as Genre[]
  ),
  [FollowArtistsCategory.HIP_HOP_RAP]: [Genre.HIP_HOP_RAP],
  [FollowArtistsCategory.ALTERNATIVE]: [Genre.ALTERNATIVE],
  [FollowArtistsCategory.POP]: [Genre.POP]
}

function* getArtistsToFollow() {
  const users = yield* select(getUsers)
  yield* put(signOnActions.setUsersToFollow(users))
}

function* fetchDefaultFollowArtists() {
  yield* call(waitForRead)
  try {
    const defaultFollowUserIds = yield* call(getDefautFollowUserIds)
    yield* call(fetchUsers, Array.from(defaultFollowUserIds))
  } catch (e: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: e,
      name: 'Sign Up: Unable to fetch default follow artists'
    })
  }
}

function* fetchAllFollowArtist() {
  yield* call(waitForRead)
  try {
    // Fetch Featured Follow artists first
    const suggestedUserFollowIds = yield* call(fetchSuggestedFollowUserIds)
    yield* call(fetchUsers, suggestedUserFollowIds)
    yield* put(
      signOnActions.fetchFollowArtistsSucceeded(
        FollowArtistsCategory.FEATURED,
        suggestedUserFollowIds
      )
    )
    yield* all(
      Object.keys(followArtistCategoryGenreMappings).map((category) =>
        fetchFollowArtistGenre(category as SelectableArtistCategory)
      )
    )
  } catch (e) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: e as Error,
      name: 'Sign Up: Unable to fetch sign up follows'
    })
  }
}

function* fetchFollowArtistGenre(
  followArtistCategory: SelectableArtistCategory
) {
  const sdk = yield* getSDK()
  const genres = followArtistCategoryGenreMappings[followArtistCategory]
  const defaultFollowUserIds = yield* call(getDefautFollowUserIds)
  try {
    const { data: sdkUsers } = yield* call(
      [sdk.full.users, sdk.full.users.getTopUsersInGenre],
      {
        genre: genres,
        limit: 31,
        offset: 0
      }
    )
    const users = transformAndCleanList(sdkUsers, userMetadataFromSDK)
    const userOptions = users
      .filter((user) => !defaultFollowUserIds.has(user.user_id))
      .slice(0, 30)

    yield* call(processAndCacheUsers, userOptions)
    const userIds = userOptions.map(({ user_id: id }) => id)
    yield* put(
      signOnActions.fetchFollowArtistsSucceeded(followArtistCategory, userIds)
    )
  } catch (error: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error,
      name: 'Sign Up: fetchFollowArtistGenre failed',
      additionalInfo: { genres, defaultFollowUserIds }
    })
    yield* put(signOnActions.fetchFollowArtistsFailed(error))
  }
}

function* fetchReferrer(
  action: ReturnType<typeof signOnActions.fetchReferrer>
) {
  yield* waitForRead()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { handle } = action
  if (handle) {
    try {
      const user = yield* call(fetchUserByHandle, handle)
      if (!user) return
      yield* put(signOnActions.setReferrer(user.user_id))

      // Check if the user is already signed in
      // If so, apply retroactive referrals

      const currentUser = yield* select(getAccountUser)
      if (
        currentUser &&
        !currentUser.events?.referrer &&
        currentUser.user_id !== user.user_id
      ) {
        yield* call(audiusBackendInstance.updateCreator, {
          ...currentUser,
          events: { referrer: user.user_id }
        })
      }
    } catch (e: any) {
      const reportToSentry = yield* getContext('reportToSentry')
      reportToSentry({
        error: e,
        name: 'Sign Up: fetchReferrer failed'
      })
    }
  }
}

const isRestrictedHandle = (handle: string) =>
  restrictedHandles.has(handle.toLowerCase())
const isHandleCharacterCompliant = (handle: string) =>
  /^[a-zA-Z0-9_.]*$/.test(handle)

function* validateHandle(
  action: ReturnType<typeof signOnActions.validateHandle>
) {
  const { handle, isOauthVerified, onValidate } = action
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const { ENVIRONMENT } = yield* getContext('env')

  yield* call(waitForWrite)
  try {
    if (handle.length > MAX_HANDLE_LENGTH) {
      yield* put(signOnActions.validateHandleFailed('tooLong'))
      if (onValidate) onValidate(true)
      return
    } else if (!isHandleCharacterCompliant(handle)) {
      yield* put(signOnActions.validateHandleFailed('characters'))
      if (onValidate) onValidate(true)
      return
    } else if (isRestrictedHandle(handle)) {
      yield* put(signOnActions.validateHandleFailed('inUse'))
      if (onValidate) onValidate(true)
      return
    }
    yield* delay(1000) // Wait 1000ms to debounce user input

    // Call fetch user by handle and do not retry if the user is not created, it will
    // return 404 and force discovery reselection
    const user = yield* call(
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
      const verifyTwitter = remoteConfigInstance.getFeatureEnabled(
        FeatureFlags.VERIFY_HANDLE_WITH_TWITTER
      )
      const verifyInstagram = remoteConfigInstance.getFeatureEnabled(
        FeatureFlags.VERIFY_HANDLE_WITH_INSTAGRAM
      )
      const verifyTikTok = remoteConfigInstance.getFeatureEnabled(
        FeatureFlags.VERIFY_HANDLE_WITH_TIKTOK
      )

      const [twitterResult, instagramResult, tiktokResult] = yield* all([
        race({
          data: verifyTwitter
            ? call(audiusBackendInstance.twitterHandle, handle)
            : null,
          timeout: delay(handleCheckTimeout)
        }),
        race({
          data: verifyInstagram
            ? call(audiusBackendInstance.instagramHandle, handle)
            : null,
          timeout: delay(handleCheckTimeout)
        }),
        race({
          data: verifyTikTok
            ? call(audiusBackendInstance.tiktokHandle, handle)
            : null,
          timeout: delay(handleCheckTimeout)
        })
      ])

      const twitterUserQuery = twitterResult?.timeout
        ? null
        : twitterResult?.data
      const instagramUser = instagramResult?.timeout
        ? null
        : instagramResult?.data
      const tikTokUser = tiktokResult?.timeout ? null : tiktokResult?.data

      const handleCheckStatus = parseHandleReservedStatusFromSocial({
        isOauthVerified,
        // @ts-ignore
        lookedUpTwitterUser: twitterUserQuery?.user?.profile?.[0] ?? null,
        lookedUpInstagramUser: (instagramUser as InstagramUser) || null,
        lookedUpTikTokUser: (tikTokUser as TikTokUser) || null
      })

      if (handleCheckStatus !== 'notReserved') {
        yield* put(signOnActions.validateHandleFailed(handleCheckStatus))
        if (onValidate) onValidate(true)
        return
      }
    }

    if (handleInUse) {
      yield* put(signOnActions.validateHandleFailed('inUse'))
      if (onValidate) onValidate(true)
    } else {
      yield* put(signOnActions.validateHandleSucceeded())
      if (onValidate) onValidate(false)
    }
  } catch (err: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: err,
      name: 'Sign Up: validateHandle failed'
    })
    yield* put(signOnActions.validateHandleFailed(err.message))
    if (onValidate) onValidate(true)
  }
}

function* checkEmail(action: ReturnType<typeof signOnActions.checkEmail>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  if (!isValidEmailString(action.email)) {
    yield* put(signOnActions.validateEmailFailed('characters'))
    return
  }

  try {
    const inUse = yield* call(audiusBackendInstance.emailInUse, action.email)
    if (inUse) {
      yield* put(signOnActions.goToPage(Pages.SIGNIN))
      // let mobile client know that email is in use
      yield* put(signOnActions.validateEmailSucceeded(false))
      if (action.onUnavailable) {
        yield* call(action.onUnavailable)
      }
    } else {
      const trackEvent = make(Name.CREATE_ACCOUNT_COMPLETE_EMAIL, {
        emailAddress: action.email
      })
      yield* put(trackEvent)
      yield* put(signOnActions.validateEmailSucceeded(true))
      yield* put(signOnActions.goToPage(Pages.PASSWORD))
      if (action.onAvailable) {
        yield* call(action.onAvailable)
      }
    }
  } catch (error) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: error as Error,
      level: ErrorLevel.Error,
      name: 'Sign Up: email check failed'
    })
    yield* put(toast({ content: messages.emailCheckFailed }))
    if (action.onError) {
      yield* call(action.onError)
    }
  }
}

function* validateEmail(
  action: ReturnType<typeof signOnActions.validateEmail>
) {
  if (!isValidEmailString(action.email)) {
    yield* put(signOnActions.validateEmailFailed('characters'))
  } else {
    yield* put(signOnActions.validateEmailSucceeded(true))
  }
}

function* refreshHedgehogWallet() {
  const authService = yield* getContext('authService')
  yield* call([
    authService.hedgehogInstance,
    authService.hedgehogInstance.refreshWallet
  ])
}

function* signUp() {
  const signOn = yield* select(getSignOn)
  const email = signOn.email.value
  const password = signOn.password.value
  const localStorage = yield* getContext('localStorage')
  const useMetamask = yield* call(
    [localStorage, localStorage.getItem],
    'useMetaMask'
  )

  if (email && password && useMetamask) {
    yield* call([localStorage, localStorage.removeItem], 'useMetaMask')
    yield* put(backendActions.setupBackend())
  }

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { waitForRemoteConfig } = yield* getContext('remoteConfigInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')

  yield* call(waitForWrite)

  const location = yield* call(getCityAndRegion)
  const name = signOn.name.value.trim()

  const handle = signOn.handle.value
  const alreadyExisted = signOn.accountAlreadyExisted
  const referrer = signOn.referrer
  const createUserMetadata = {
    name,
    handle,
    profilePicture: (signOn.profileImage?.file as File) || null,
    coverPhoto: (signOn.coverPhoto?.file as File) || null,
    isVerified: signOn.verified,
    location
  }

  yield* call(audiusBackendInstance.setUserHandleForRelay, handle)

  const feePayerOverride = yield* select(getFeePayer)

  yield* put(
    confirmerActions.requestConfirmation(
      handle,
      function* () {
        const reportToSentry = yield* getContext('reportToSentry')
        const { blockHash, blockNumber, userId, error, errorStatus, phase } =
          yield* call(audiusBackendInstance.signUp, {
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
          const params: signOnActions.SignUpFailedParams = {
            error,
            phase,
            shouldReport: !rateLimited && !blocked,
            shouldToast: rateLimited
          }
          if (rateLimited) {
            params.message = 'Please try again later'
            yield* put(
              make(Name.CREATE_ACCOUNT_RATE_LIMIT, {
                handle,
                email,
                location
              })
            )
            reportToSentry({
              error,
              level: ErrorLevel.Warning,
              name: 'Sign Up: User rate limited',
              additionalInfo: {
                handle,
                email,
                location,
                userId,
                formFields: createUserMetadata,
                hasWallet: alreadyExisted
              }
            })
          } else if (blocked) {
            params.message = 'User was blocked'
            params.uiErrorCode = UiErrorCode.RELAY_BLOCKED
            yield* put(
              make(Name.CREATE_ACCOUNT_BLOCKED, {
                handle,
                email,
                location
              })
            )
            reportToSentry({
              error,
              level: ErrorLevel.Warning,
              name: 'Sign Up: User was blocked',
              additionalInfo: {
                handle,
                email,
                location,
                userId,
                formFields: createUserMetadata,
                hasWallet: alreadyExisted
              }
            })
          } else {
            reportToSentry({
              error,
              level: ErrorLevel.Error,
              name: 'Sign Up: Unknown sign up error',
              additionalInfo: {
                handle,
                email,
                location,
                userId,
                formFields: createUserMetadata,
                hasWallet: alreadyExisted
              }
            })
          }
          yield* put(signOnActions.signUpFailed(params))
          return
        }

        if (!signOn.useMetaMask && signOn.twitterId) {
          const { error } = yield* call(
            audiusBackendInstance.associateTwitterAccount,
            signOn.twitterId,
            userId,
            handle,
            blockNumber
          )
          if (error) {
            reportToSentry({
              error: new Error(error as string),
              name: 'Sign Up: Error while associating Twitter account'
            })
            yield* put(signOnActions.setTwitterProfileError(error as string))
          }
        }
        if (!signOn.useMetaMask && signOn.instagramId) {
          const { error } = yield* call(
            audiusBackendInstance.associateInstagramAccount,
            signOn.instagramId,
            userId,
            handle,
            blockNumber
          )
          if (error) {
            reportToSentry({
              error: new Error(error as string),
              name: 'Sign Up: Error while associating Instagram account'
            })
            yield* put(signOnActions.setInstagramProfileError(error as string))
          }
        }

        if (!signOn.useMetaMask && signOn.tikTokId) {
          const { error } = yield* call(
            audiusBackendInstance.associateTikTokAccount,
            signOn.tikTokId,
            userId,
            handle,
            blockNumber
          )
          if (error) {
            reportToSentry({
              error: new Error(error as string),
              name: 'Sign Up: Error while associating TikTok account'
            })
            yield* put(signOnActions.setTikTokProfileError(error as string))
          }
        }

        yield* put(
          identify(handle, {
            name,
            email,
            userId
          })
        )

        yield* put(signOnActions.signUpSucceededWithId(userId))

        const isNativeMobile = yield* getContext('isNativeMobile')

        yield* call(waitForRemoteConfig)

        if (!isNativeMobile) {
          // Set the has request browser permission to true as the signon provider will open it
          setHasRequestedBrowserPermission()
        }

        // Check feature flag to disable confirmation
        const disableSignUpConfirmation = yield* call(
          getFeatureEnabled,
          FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION
        )

        if (!disableSignUpConfirmation) {
          const confirmed = yield* call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            const error = new Error(`Could not confirm sign up for user`)
            reportToSentry({
              error,
              name: 'Sign Up',
              additionalInfo: {
                userId,
                disableSignUpConfirmation,
                handle,
                name,
                email
              }
            })
            throw error
          }
        }
      },
      function* () {
        // TODO (PAY-3479): This is temporary until hedgehog is fully moved out of libs
        yield* call(refreshHedgehogWallet)
        yield* put(signOnActions.sendWelcomeEmail(name))
        yield* fetchAccountAsync({ isSignUp: true })
        yield* put(signOnActions.followArtists())
        yield* put(make(Name.CREATE_ACCOUNT_COMPLETE_CREATING, { handle }))
        yield* put(signOnActions.signUpSucceeded())
      },
      function* ({ timeout, error, message }) {
        if (timeout) {
          console.debug('Timed out trying to register')
          yield* put(signOnActions.signUpTimeout())
        }
        if (error) {
          const reportToSentry = yield* getContext('reportToSentry')
          reportToSentry({
            error,
            name: 'Sign Up: Error in signUp saga',
            additionalInfo: { message, timeout }
          })
        }
        if (message) {
          console.debug(message)
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
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')
    yield* call(waitForAccount)
    const audiusLibs = yield* call([
      audiusBackendInstance,
      audiusBackendInstance.getAudiusLibs
    ])

    // Need at least a name, handle, and wallet to repair
    const metadata = yield* select(getAccountUser)
    if (!metadata || !(metadata.name && metadata.handle && metadata.wallet)) {
      return
    }

    const User = audiusLibs.User
    const dnUser = yield* call(
      [User, User.getUsers],
      1, // limit
      0, // offset
      [metadata.user_id], // userIds
      null, // walletAddress
      null, // handle
      null // minBlockNumber
    )
    const users = dnUser as unknown as UserMetadata[] | null | undefined
    if (users && users.length > 0) {
      return
    }
    yield* put(
      confirmerActions.requestConfirmation(
        metadata.handle,
        function* () {
          console.info('Repairing user')
          yield* put(make(Name.SIGN_UP_REPAIR_START, {}))
          yield* call([User, User.repairEntityManagerUserV2], metadata)
        },
        function* () {
          console.info('Successfully repaired user')
          yield* put(make(Name.SIGN_UP_REPAIR_SUCCESS, {}))
          yield* put(signOnActions.sendWelcomeEmail(metadata.name))
          yield* fetchAccountAsync({ isSignUp: true })
        },
        function* ({ timeout }) {
          const reportToSentry = yield* getContext('reportToSentry')
          reportToSentry({
            error: new Error('Failed to repair user'),
            name: 'Sign Up',
            additionalInfo: { userMetadata: metadata, dnUser }
          })
          yield* put(make(Name.SIGN_UP_REPAIR_FAILURE, {}))
          if (timeout) {
            console.debug('Timed out trying to fix registration')
            yield* put(signOnActions.signUpTimeout())
          }
        },
        () => {},
        SIGN_UP_TIMEOUT_MILLIS
      )
    )
  } catch (e) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: e as Error,
      name: 'Sign Up: Failed to repair account'
    })
  }
}

function* signIn(action: ReturnType<typeof signOnActions.signIn>) {
  const { email, password, visitorId, otp } = action
  const localStorage = yield* getContext('localStorage')
  const useMetamask = yield* call(
    [localStorage, localStorage.getItem],
    'useMetaMask'
  )

  if (email && password && useMetamask) {
    yield* call([localStorage, localStorage.removeItem], 'useMetaMask')
    yield* put(backendActions.setupBackend())
  }

  const fingerprintClient = yield* getContext('fingerprintClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const authService = yield* getContext('authService')
  const isNativeMobile = yield* getContext('isNativeMobile')
  const isElectron = yield* getContext('isElectron')
  const clientOrigin = isNativeMobile
    ? 'mobile'
    : isElectron
    ? 'desktop'
    : 'web'

  yield* call(waitForRead)
  try {
    const signOn = yield* select(getSignOn)
    const fpResponse = yield* call(
      [fingerprintClient, fingerprintClient.identify],
      email ?? signOn.email.value,
      clientOrigin
    )

    let signInResponse: SignInResponse
    try {
      signInResponse = yield* call(
        authService.signIn,
        email ?? signOn.email.value,
        password ?? signOn.password.value,
        visitorId ?? fpResponse?.visitorId,
        otp ?? signOn.otp.value
      )
    } catch (err) {
      // Login failed entirely (no wallet returned)
      yield* put(signOnActions.signInFailed(String(err), 'FIND_WALLET', false))
      const trackEvent = make(Name.SIGN_IN_FINISH, {
        status: 'invalid credentials'
      })
      yield* put(trackEvent)
      return
    }

    const account: AccountUserMetadata | null = yield* call(
      userApiFetchSaga.getUserAccount,
      {
        wallet: signInResponse.walletAddress
      }
    )

    // Login succeeded but we found no account for the user (incomplete signup)
    if (!account) {
      yield* put(
        signOnActions.openSignOn(false, Pages.PROFILE, {
          accountAlreadyExisted: true
        })
      )
      yield* put(toastActions.toast({ content: messages.incompleteAccount }))
      return
    }

    const { user } = account

    // Loging succeeded and we found a user, but it's missing name, likely
    // due to incomplete signup
    if (!user.name) {
      yield* put(
        signOnActions.openSignOn(false, Pages.PROFILE, {
          accountAlreadyExisted: true,
          handle: {
            value: user.handle,
            status: 'disabled'
          }
        })
      )
      yield* put(toastActions.toast({ content: messages.incompleteAccount }))

      yield* put(
        make(Name.SIGN_IN_WITH_INCOMPLETE_ACCOUNT, {
          handle: user.handle
        })
      )
      return
    }

    // Now that we have verified the user is valid, run the account fetch flow,
    // which will pull cached account data from call above.
    yield* put(accountActions.fetchAccount())

    // Re-setup backend to make sure libs has the correct hedgehog wallet and userId
    const { web3Error, libsError } = yield* call(audiusBackendInstance.setup, {
      wallet: signInResponse.walletAddress,
      userId: user.user_id
    })

    if (web3Error || libsError) {
      yield* put(
        signOnActions.signInFailed(
          'Failed to setup AudiusBackend',
          'SETUP',
          true
        )
      )
      return
    }
    yield* put(signOnActions.signInSucceeded())
    const route = yield* select(getRouteOnCompletion)

    // NOTE: Wait on the account success before recording the signin event so that the user account is
    // populated in the store
    const { failure } = yield* race({
      success: take(accountActions.fetchAccountSucceeded.type),
      failure: take(accountActions.fetchAccountFailed)
    })
    if (failure) {
      yield* put(
        signOnActions.signInFailed(
          `Couldn't get account: ${failure.payload.reason}`,
          'FIND_USER',
          failure.payload.reason === 'ACCOUNT_DEACTIVATED'
        )
      )
      const trackEvent = make(Name.SIGN_IN_FINISH, {
        status: 'fetch account failed'
      })
      yield* put(trackEvent)
      return
    }

    // Apply retroactive referral
    if (!user.events?.referrer && signOn.referrer) {
      yield* fork(audiusBackendInstance.updateCreator, {
        ...user,
        events: { referrer: signOn.referrer }
      })
    }

    yield* put(pushRoute(route || FEED_PAGE))

    const trackEvent = make(Name.SIGN_IN_FINISH, { status: 'success' })
    yield* put(trackEvent)

    yield* put(signOnActions.resetSignOn())

    const isNativeMobile = yield* getContext('isNativeMobile')
    if (!isNativeMobile) {
      // Reset the sign on in the background after page load as to relieve the UI loading
      yield* delay(1000)
    }
    if (isNativeMobile) {
      yield* put(requestPushNotificationPermissions())
    } else {
      setHasRequestedBrowserPermission()
      yield* put(accountActions.showPushNotificationConfirmation())
      if (user.handle === 'fbtest') {
        yield put(pushRoute('/fb/share'))
      }
    }
  } catch (err: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: err,
      name: 'Sign In: unknown error'
    })
    yield* put(signOnActions.signInFailed(err))
  }
}

function* followCollections(
  collectionIds: ID[],
  favoriteSource: FavoriteSource
) {
  yield* call(waitForWrite)
  try {
    const result = yield* call(retrieveCollections, collectionIds)

    for (let i = 0; i < collectionIds.length; i++) {
      const id = collectionIds[i]
      if (result?.collections?.[id]) {
        yield* put(saveCollection(id, favoriteSource))
      }
    }
  } catch (err) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: err as Error,
      level: ErrorLevel.Error,
      name: 'Sign Up: Follow collections failed',
      additionalInfo: { collectionIds, favoriteSource }
    })
  }
}

/* This saga makes sure that artists chosen in sign up get followed accordingly */
export function* completeFollowArtists(
  _action: ReturnType<typeof signOnActions.completeFollowArtists>
) {
  const accountId = yield* select(accountSelectors.getUserId)
  if (accountId) {
    // If account creation has finished we need to make sure followArtists gets called
    // Also we specifically request to not follow the defaults (Audius user, Hot & New Playlist) since that should have already occurred
    yield* put(signOnActions.followArtists(true))
  }
  // Otherwise, Account creation still in progress and followArtists will get called already, no need to call here
}

function* followArtists(
  action: ReturnType<typeof signOnActions.followArtists>
) {
  const { skipDefaultFollows } = action
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { ENVIRONMENT } = yield* getContext('env')
  const defaultFollowUserIds = skipDefaultFollows
    ? new Set([])
    : yield* call(getDefautFollowUserIds)
  yield* call(waitForWrite)
  try {
    // Auto-follow Hot & New Playlist
    if (!skipDefaultFollows) {
      if (ENVIRONMENT === 'production') {
        yield* fork(followCollections, [4281], FavoriteSource.SIGN_UP)
      } else if (ENVIRONMENT === 'staging') {
        yield* fork(followCollections, [555], FavoriteSource.SIGN_UP)
      }
    }

    const signOn = yield* select(getSignOn)
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
      yield* put(
        socialActions.followUser(userId as number, FollowSource.SIGN_UP)
      )
    }
    const hasFollowConfirmed = userIdsToFollow.map(() => false)
    while (!hasFollowConfirmed.every(Boolean)) {
      const { success, failed } = yield* race({
        success: take<ReturnType<typeof socialActions.followUserSucceeded>>(
          socialActions.FOLLOW_USER_SUCCEEDED
        ),
        failed: take<ReturnType<typeof socialActions.followUserFailed>>(
          socialActions.FOLLOW_USER_FAILED
        )
      })
      const followAction = success || failed
      if (failed) {
        const reportToSentry = yield* getContext('reportToSentry')
        reportToSentry({
          error: new Error(failed.error),
          name: 'Sign Up: Artist follow failed during sign up',
          additionalInfo: {
            userId: failed.userId,
            userIdsToFollow,
            skipDefaultFollows
          }
        })
      }
      const userIndex = userIdsToFollow.findIndex(
        (fId) => fId === followAction?.userId
      )
      if (userIndex > -1) hasFollowConfirmed[userIndex] = true
    }

    // Reload feed is in view
    yield* put(signOnActions.setAccountReady())
    // The update user location depends on the user being discoverable in discprov
    // So we wait until both the user is indexed and the follow user actions are finished
    yield* call(audiusBackendInstance.updateUserLocationTimezone)

    // Re-cache the account here (in local storage). This is to make sure that the follows are
    // persisted across the next refresh of the client. Initially the user is pulled in from
    // local storage before we get any response back from a discovery node.
    yield* call(reCacheAccount)
  } catch (err: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: err,
      name: 'Sign Up: Unkown error while following artists on sign up'
    })
  }
}

function* configureMetaMask() {
  try {
    window.localStorage.setItem('useMetaMask', JSON.stringify(true))
    yield* put(backendActions.setupBackend())
  } catch (err: any) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      error: err,
      name: 'Sign Up: Configure metamask failed'
    })
  }
}

export function* watchCompleteFollowArtists() {
  yield* takeEvery(signOnActions.COMPLETE_FOLLOW_ARTISTS, completeFollowArtists)
}

function* watchGetArtistsToFollow() {
  yield* takeEvery(signOnActions.GET_USERS_TO_FOLLOW, getArtistsToFollow)
}

function* watchFetchAllFollowArtists() {
  yield* takeEvery(signOnActions.FETCH_ALL_FOLLOW_ARTISTS, fetchAllFollowArtist)
}

function* watchFetchReferrer() {
  yield* takeLatest(signOnActions.FETCH_REFERRER, fetchReferrer)
}

function* watchCheckEmail() {
  yield* takeLatest(signOnActions.CHECK_EMAIL, checkEmail)
}

function* watchValidateEmail() {
  yield* takeLatest(signOnActions.VALIDATE_EMAIL, validateEmail)
}

function* watchValidateHandle() {
  yield* takeLatest(signOnActions.VALIDATE_HANDLE, validateHandle)
}

function* watchSignUp() {
  yield* takeLatest(
    signOnActions.SIGN_UP,
    function* (_action: ReturnType<typeof signOnActions.signUp>) {
      // Fetch the default follow artists in parallel so that we don't have to block on this later (thus adding perceived sign up time) in the follow artists step.
      yield* fork(fetchDefaultFollowArtists)
      yield* signUp()
    }
  )
}

function* watchSignIn() {
  yield* takeLatest(signOnActions.SIGN_IN, signIn)
}

function* watchConfigureMetaMask() {
  yield* takeLatest(signOnActions.CONFIGURE_META_MASK, configureMetaMask)
}

function* watchFollowArtists() {
  yield* takeLatest(signOnActions.FOLLOW_ARTISTS, followArtists)
}

function* watchOpenSignOn() {
  yield* takeLatest(
    signOnActions.OPEN_SIGN_ON,
    function* (action: ReturnType<typeof signOnActions.openSignOn>) {
      const route = action.signIn ? SIGN_IN_PAGE : SIGN_UP_PAGE
      yield* put(pushRoute(route))
    }
  )
}

function* watchSendWelcomeEmail() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeLatest(
    signOnActions.SEND_WELCOME_EMAIL,
    function* (action: ReturnType<typeof signOnActions.sendWelcomeEmail>) {
      const hasAccount = yield* select(getHasAccount)
      if (!hasAccount) return
      yield* call(audiusBackendInstance.sendWelcomeEmail, {
        name: action.name
      })
    }
  )
}

export default function sagas() {
  const sagas = [
    watchCompleteFollowArtists,
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
    watchOpenSignOn,
    watchSignOnError,
    watchSendWelcomeEmail,
    repairSignUp
  ]
  return sagas
}
