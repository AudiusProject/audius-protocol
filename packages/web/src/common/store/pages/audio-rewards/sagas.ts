import {
  undisbursedUserChallengeFromSDK,
  userChallengeFromSDK
} from '@audius/common/adapters'
import {
  UserChallenge,
  ChallengeRewardID,
  StringWei,
  SpecifierWithAmount,
  Name,
  Id
} from '@audius/common/models'
import {
  IntKeys,
  StringKeys,
  Env,
  RemoteConfigInstance
} from '@audius/common/services'
import {
  accountActions,
  accountSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  HCaptchaStatus,
  ClaimStatus,
  walletActions,
  modalsActions,
  getContext,
  musicConfettiActions,
  CommonStoreContext,
  getSDK
} from '@audius/common/store'
import {
  encodeHashId,
  isResponseError,
  route,
  waitForValue
} from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import { AudiusSdk, ChallengeId, Errors, RewardManagerError } from '@audius/sdk'
import {
  call,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
  delay,
  all
} from 'typed-redux-saga'

import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForRead } from 'utils/sagaHelpers'
import {
  foregroundPollingDaemon,
  visibilityPollingDaemon
} from 'utils/sagaPollingDaemons'

const { AUDIO_PAGE } = route
const { show: showMusicConfetti } = musicConfettiActions
const { setVisibility } = modalsActions
const { getBalance, increaseBalance } = walletActions
const {
  getClaimStatus,
  getClaimToRetry,
  getUserChallenge,
  getUserChallengesOverrides,
  getUserChallengeSpecifierMap
} = audioRewardsPageSelectors
const {
  resetAndCancelClaimReward,
  claimChallengeReward,
  claimAllChallengeRewards,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimAllChallengeRewardsSucceeded,
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded,
  setHCaptchaStatus,
  setUserChallengesDisbursed,
  updateHCaptchaScore,
  showRewardClaimedToast,
  setUserChallengeCurrentStepCount,
  resetUserChallengeCurrentStepCount,
  updateOptimisticListenStreak,
  setUndisbursedChallenges
} = audioRewardsPageActions
const fetchAccountSucceeded = accountActions.fetchAccountSucceeded

const { getUserId } = accountSelectors

const CHALLENGE_REWARDS_MODAL_NAME = 'ChallengeRewardsExplainer'

function getOracleConfig(remoteConfigInstance: RemoteConfigInstance, env: Env) {
  const { ENVIRONMENT, ORACLE_ETH_ADDRESSES, AAO_ENDPOINT } = env
  let oracleEthAddress = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ETH_ADDRESS
  )
  let AAOEndpoint = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ENDPOINT
  )
  if (ENVIRONMENT === 'development') {
    const oracleEthAddresses = (ORACLE_ETH_ADDRESSES || '').split(',')
    if (oracleEthAddresses.length > 0) {
      oracleEthAddress = oracleEthAddresses[0]
    }
    if (AAO_ENDPOINT) {
      AAOEndpoint = AAO_ENDPOINT
    }
  }

  return { oracleEthAddress, AAOEndpoint }
}

function* retryClaimChallengeReward({
  errorResolved,
  retryOnFailure
}: {
  errorResolved: boolean
  retryOnFailure: boolean
}) {
  const claimStatus = yield* select(getClaimStatus)
  const claim = yield* select(getClaimToRetry)
  if (!claim) return
  if (claimStatus === ClaimStatus.WAITING_FOR_RETRY) {
    // Restore the challenge rewards modal if necessary
    yield* put(
      setVisibility({ modal: CHALLENGE_REWARDS_MODAL_NAME, visible: true })
    )
    if (errorResolved) {
      yield* put(claimChallengeReward({ claim, retryOnFailure }))
    } else {
      yield* put(claimChallengeRewardFailed())
    }
  }
}

const getClaimingConfig = (
  remoteConfigInstance: RemoteConfigInstance,
  env: Env
) => {
  const { ENVIRONMENT } = env
  let quorumSize
  if (ENVIRONMENT === 'development') {
    quorumSize = 2
  } else {
    quorumSize = remoteConfigInstance.getRemoteVar(
      IntKeys.ATTESTATION_QUORUM_SIZE
    )
  }
  const maxClaimRetries = remoteConfigInstance.getRemoteVar(
    IntKeys.MAX_CLAIM_RETRIES
  )
  const rewardsAttestationEndpoints = remoteConfigInstance.getRemoteVar(
    StringKeys.REWARDS_ATTESTATION_ENDPOINTS
  )
  const parallelization = remoteConfigInstance.getRemoteVar(
    IntKeys.CLIENT_ATTESTATION_PARALLELIZATION
  )
  const completionPollTimeout =
    remoteConfigInstance.getRemoteVar(
      IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_TIMEOUT_MS
    ) ?? undefined
  const completionPollFrequency =
    remoteConfigInstance.getRemoteVar(
      IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_FREQUENCY_MS
    ) ?? undefined
  const { oracleEthAddress, AAOEndpoint } = getOracleConfig(
    remoteConfigInstance,
    env
  )

  return {
    quorumSize,
    maxClaimRetries,
    oracleEthAddress,
    AAOEndpoint,
    rewardsAttestationEndpoints,
    parallelization,
    completionPollFrequency,
    completionPollTimeout
  }
}

function* waitForOptimisticChallengeToComplete({
  challengeId,
  completionPollFrequency,
  completionPollTimeout
}: {
  challengeId: ChallengeRewardID
  completionPollFrequency?: number
  completionPollTimeout?: number
}) {
  const challenge = yield* select(getUserChallenge, {
    challengeId
  })
  if (challenge.challenge_type !== 'aggregate' && !challenge.is_complete) {
    console.info('Waiting for challenge completion...')
    const raceResult: { isComplete?: UserChallenge } = yield* race({
      isComplete: call(
        waitForValue,
        getUserChallenge,
        { challengeId },
        (challenge: UserChallenge) => challenge.is_complete
      ),
      poll: call(pollUserChallenges, completionPollFrequency ?? 1000),
      timeout: delay(completionPollTimeout ?? 10000)
    })
    if (!raceResult.isComplete) {
      console.warn(
        'Challenge still not marked as completed on DN. Attempting attestations anyway, but may fail...'
      )
    }
  }
}

type ErrorResult = SpecifierWithAmount & {
  error: unknown
}

async function claimRewardsForChallenge({
  sdk,
  userId,
  challengeId,
  specifiers,
  track,
  make
}: {
  sdk: AudiusSdk
  userId: string
  challengeId: ChallengeId
  specifiers: SpecifierWithAmount[]
  track: CommonStoreContext['analytics']['track']
  make: CommonStoreContext['analytics']['make']
}): Promise<(SpecifierWithAmount | ErrorResult)[]> {
  return await Promise.all(
    specifiers.map(async (specifierWithAmount) =>
      track(
        make({
          eventName: Name.REWARDS_CLAIM_REQUEST,
          challengeId,
          specifier: specifierWithAmount.specifier,
          amount: specifierWithAmount.amount
        })
      )
        .then(() =>
          sdk.challenges.claimReward({
            challengeId,
            specifier: specifierWithAmount.specifier,
            amount: specifierWithAmount.amount,
            userId
          })
        )
        .then(() =>
          track(
            make({
              eventName: Name.REWARDS_CLAIM_SUCCESS,
              challengeId,
              specifier: specifierWithAmount.specifier,
              amount: specifierWithAmount.amount
            })
          )
        )
        .then(() => {
          return specifierWithAmount
        })
        // Handle the individual specifier failures here to let the other
        // ones continue to claim and not reject the all() call.
        .catch(async (error: unknown) => {
          if (error instanceof Errors.AntiAbuseOracleAttestationError) {
            await track(
              make({
                eventName: Name.REWARDS_CLAIM_BLOCKED,
                challengeId,
                specifier: specifierWithAmount.specifier,
                amount: specifierWithAmount.amount,
                code: error.code as number
              })
            )
          } else if (isResponseError(error)) {
            await track(
              make({
                eventName: Name.REWARDS_CLAIM_FAILURE,
                challengeId,
                specifier: specifierWithAmount.specifier,
                amount: specifierWithAmount.amount,
                url: error.response.url,
                error: await error.response.clone().text()
              })
            )
          } else if (error instanceof RewardManagerError) {
            await track(
              make({
                eventName: Name.REWARDS_CLAIM_FAILURE,
                challengeId,
                specifier: specifierWithAmount.specifier,
                amount: specifierWithAmount.amount,
                error: error.customErrorName ?? 'Unknown',
                instruction: error.instructionName
              })
            )
          } else {
            await track(
              make({
                eventName: Name.REWARDS_CLAIM_FAILURE,
                challengeId,
                specifier: specifierWithAmount.specifier,
                amount: specifierWithAmount.amount,
                error: (error as any).toString()
              })
            )
          }
          return {
            ...specifierWithAmount,
            error
          }
        })
    )
  )
}

function* claimSingleChallengeRewardAsync(
  action: ReturnType<typeof claimChallengeReward>
) {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const env = yield* getContext('env')
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  const { track, make } = yield* getContext('analytics')

  const { claim } = action.payload
  const { specifiers, challengeId } = claim

  const { completionPollFrequency, completionPollTimeout } = getClaimingConfig(
    remoteConfigInstance,
    env
  )

  yield* call(waitForOptimisticChallengeToComplete, {
    challengeId,
    completionPollFrequency,
    completionPollTimeout
  })

  const decodedUserId = yield* select(getUserId)
  if (!decodedUserId) {
    throw new Error('Failed to get current userId')
  }
  const userId = encodeHashId(decodedUserId)

  const results = yield* call(claimRewardsForChallenge, {
    sdk,
    userId,
    challengeId: challengeId as ChallengeId,
    specifiers,
    track,
    make
  })
  const claimed = results.filter((r) => !('error' in r))
  const claimedAmount = claimed.reduce((sum, { amount }) => {
    return sum + amount
  }, 0)
  yield* put(
    increaseBalance({
      amount: AUDIO(claimedAmount).value.toString() as StringWei
    })
  )
  yield* put(setUserChallengesDisbursed({ challengeId, specifiers: claimed }))

  const errors = results.filter((r): r is ErrorResult => 'error' in r)
  let aaoError: Errors.AntiAbuseOracleAttestationError | undefined
  if (errors.length > 0) {
    // Log and report errors for each specifier that failed to claim
    for (const res of errors) {
      const error =
        res.error instanceof Error ? res.error : new Error(String(res.error))
      console.error(
        `Failed to claim challenge: ${challengeId} specifier: ${res.specifier} for amount: ${res.amount} with error:`,
        error
      )
      if (res.error instanceof Errors.AntiAbuseOracleAttestationError) {
        aaoError = res.error
      } else {
        yield* call(reportToSentry, {
          error,
          name: 'ClaimRewards',
          additionalInfo: {
            challengeId,
            specifier: res.specifier,
            amount: res.amount
          }
        })
      }
    }
    const errorMessage = 'Some specifiers failed to claim'
    if (aaoError) {
      throw new Errors.AntiAbuseOracleAttestationError(
        aaoError.code,
        errorMessage
      )
    }
    throw new Error(errorMessage)
  }
}

function* claimChallengeRewardAsync(
  action: ReturnType<typeof claimChallengeReward>
) {
  try {
    yield* call(claimSingleChallengeRewardAsync, action)
    yield* put(claimChallengeRewardSucceeded())
  } catch (e) {
    if (e instanceof Errors.AntiAbuseOracleAttestationError) {
      yield* put(claimChallengeRewardFailed({ aaoErrorCode: e.code }))
    } else {
      yield* put(claimChallengeRewardFailed())
    }
  }
}

function* claimAllChallengeRewardsAsync(
  action: ReturnType<typeof claimAllChallengeRewards>
) {
  const { claims } = action.payload
  let hasError = false
  let aaoErrorCode: undefined | number
  const { track, make } = yield* getContext('analytics')
  yield* call(
    track,
    make({ eventName: Name.REWARDS_CLAIM_ALL_REQUEST, count: claims.length })
  )
  yield* all(
    claims.map((claim) =>
      call(function* () {
        try {
          yield* call(claimSingleChallengeRewardAsync, {
            type: claimChallengeReward.type,
            payload: { claim, retryOnFailure: false }
          })
        } catch (e) {
          hasError = true
          if (e instanceof Errors.AntiAbuseOracleAttestationError) {
            aaoErrorCode = e.code
          }
        }
      })
    )
  )
  if (aaoErrorCode !== undefined) {
    yield* put(claimChallengeRewardFailed({ aaoErrorCode }))
    yield* call(
      track,
      make({
        eventName: Name.REWARDS_CLAIM_ALL_BLOCKED,
        count: claims.length,
        code: aaoErrorCode
      })
    )
  } else if (hasError) {
    yield* put(claimChallengeRewardFailed())
    yield* call(
      track,
      make({ eventName: Name.REWARDS_CLAIM_ALL_FAILURE, count: claims.length })
    )
  } else {
    yield* put(claimAllChallengeRewardsSucceeded())
    yield* call(
      track,
      make({ eventName: Name.REWARDS_CLAIM_ALL_SUCCESS, count: claims.length })
    )
  }
}

function* watchSetHCaptchaStatus() {
  yield* takeLatest(
    setHCaptchaStatus.type,
    function* (action: ReturnType<typeof setHCaptchaStatus>) {
      const { status } = action.payload
      yield* call(retryClaimChallengeReward, {
        errorResolved: status === HCaptchaStatus.SUCCESS,
        retryOnFailure: true
      })
    }
  )
}

function* watchClaimChallengeReward() {
  yield* takeLatest(
    claimChallengeReward.type,
    function* (args: ReturnType<typeof claimChallengeReward>) {
      // Race the claim against the user clicking "close" on the modal,
      // so that the claim saga gets canceled if the modal is closed
      yield* race({
        task: call(claimChallengeRewardAsync, args),
        cancel: take(resetAndCancelClaimReward.type)
      })
    }
  )
}

function* watchClaimAllChallengeRewards() {
  yield* takeLatest(
    claimAllChallengeRewards.type,
    claimAllChallengeRewardsAsync
  )
}

function* fetchUserChallengesAsync() {
  yield* call(waitForRead)
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  try {
    const { data: challengesData = [] } = yield* call(
      [sdk.users, sdk.users.getUserChallenges],
      {
        id: Id.parse(currentUserId)
      }
    )

    const userChallenges = challengesData.map(userChallengeFromSDK)

    const { data = [] } = yield* call(
      [sdk.challenges, sdk.challenges.getUndisbursedChallenges],
      {
        userId: Id.parse(currentUserId)
      }
    )
    const undisbursedChallenges = data.map(undisbursedUserChallengeFromSDK)

    yield* put(fetchUserChallengesSucceeded({ userChallenges }))
    yield* put(setUndisbursedChallenges(undisbursedChallenges))
  } catch (e) {
    console.error(e)
    yield* put(fetchUserChallengesFailed())
  }
}

function* checkForNewDisbursements(
  action: ReturnType<typeof fetchUserChallengesSucceeded>
) {
  const { userChallenges } = action.payload
  if (!userChallenges) {
    return
  }
  const prevChallenges = yield* select(getUserChallengeSpecifierMap)
  const challengesOverrides = yield* select(getUserChallengesOverrides)
  let newDisbursement = false

  for (const challenge of userChallenges) {
    const prevChallenge =
      prevChallenges[challenge.challenge_id]?.[challenge.specifier]
    const challengeOverrides = challengesOverrides[challenge.challenge_id]

    // Check for new disbursements
    const wasNotPreviouslyDisbursed =
      prevChallenge && !prevChallenge.is_disbursed
    const wasNotDisbursedThisSession =
      !challengeOverrides || !challengeOverrides.is_disbursed
    if (
      challenge.is_disbursed &&
      wasNotPreviouslyDisbursed &&
      wasNotDisbursedThisSession
    ) {
      newDisbursement = true
    }
  }
  if (newDisbursement) {
    yield* put(getBalance())
    yield* put(showMusicConfetti())
    yield* put(showRewardClaimedToast())
  }
}

function* watchFetchUserChallengesSucceeded() {
  yield* takeEvery(
    fetchUserChallengesSucceeded.type,
    function* (action: ReturnType<typeof fetchUserChallengesSucceeded>) {
      yield* call(checkForNewDisbursements, action)
      yield* call(handleOptimisticChallengesOnUpdate, action)
    }
  )
}

function* watchFetchUserChallenges() {
  yield* takeEvery(fetchUserChallenges.type, function* () {
    yield* call(fetchUserChallengesAsync)
  })
}

/**
 * Resets the listen streak override if current_step_count is fetched and non-zero
 * This handles the case where discovery can reset the user's listen streak
 */
function* handleOptimisticListenStreakUpdate(
  challenge: UserChallenge,
  challengeOverrides?: Partial<UserChallenge>
) {
  if (
    (challengeOverrides?.current_step_count ?? 0) > 0 &&
    challenge.current_step_count !== 0
  ) {
    yield* put(
      resetUserChallengeCurrentStepCount({
        challengeId: challenge.challenge_id
      })
    )
  }
}

/**
 * Handles challenge override updates on user challenge updates
 */
function* handleOptimisticChallengesOnUpdate(
  action: ReturnType<typeof fetchUserChallengesSucceeded>
) {
  const { userChallenges } = action.payload
  if (!userChallenges) {
    return
  }

  const challengesOverrides = yield* select(getUserChallengesOverrides)

  for (const challenge of userChallenges) {
    if (challenge.challenge_id === 'listen-streak') {
      yield* call(
        handleOptimisticListenStreakUpdate,
        challenge,
        challengesOverrides[challenge.challenge_id]
      )
    }
  }
}

/**
 * Updates the listen streak optimistically if current_step_count is zero and a track is played
 */
function* watchUpdateOptimisticListenStreak() {
  yield* takeEvery(updateOptimisticListenStreak.type, function* () {
    const listenStreakChallenge = yield* select(getUserChallenge, {
      challengeId: 'listen-streak'
    })
    if (listenStreakChallenge?.current_step_count === 0) {
      yield* put(
        setUserChallengeCurrentStepCount({
          challengeId: 'listen-streak',
          stepCount: 1
        })
      )
    }
  })
}

function* watchUpdateHCaptchaScore() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    updateHCaptchaScore.type,
    function* (action: ReturnType<typeof updateHCaptchaScore>): any {
      const { token } = action.payload
      const userId = yield* select(accountSelectors.getUserId)
      if (!userId) {
        yield* put(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
        return
      }
      const result = yield* call(audiusBackendInstance.updateHCaptchaScore, {
        token
      })
      if (result.error) {
        yield* put(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
      } else {
        yield* put(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
      }
    }
  )
}

function* pollUserChallenges(frequency: number) {
  while (true) {
    yield* put(fetchUserChallenges())
    yield* call(delay, frequency)
  }
}

function* userChallengePollingDaemon() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  const isNativeMobile = yield* getContext('isNativeMobile')

  yield* call(remoteConfigInstance.waitForRemoteConfig)
  const defaultChallengePollingTimeout = remoteConfigInstance.getRemoteVar(
    IntKeys.CHALLENGE_REFRESH_INTERVAL_MS
  )!
  const audioRewardsPageChallengePollingTimeout =
    remoteConfigInstance.getRemoteVar(
      IntKeys.CHALLENGE_REFRESH_INTERVAL_AUDIO_PAGE_MS
    )!

  yield* take(fetchAccountSucceeded.type)
  if (!isNativeMobile) {
    yield* fork(function* () {
      yield* call(visibilityPollingDaemon, fetchUserChallenges())
    })
  }

  yield* call(
    foregroundPollingDaemon,
    fetchUserChallenges(),
    defaultChallengePollingTimeout,
    {
      [AUDIO_PAGE]: audioRewardsPageChallengePollingTimeout
    }
  )
}

const sagas = () => {
  const sagas = [
    watchFetchUserChallenges,
    watchFetchUserChallengesSucceeded,
    watchClaimChallengeReward,
    watchClaimAllChallengeRewards,
    watchSetHCaptchaStatus,
    watchUpdateHCaptchaScore,
    userChallengePollingDaemon,
    watchUpdateOptimisticListenStreak
  ]
  return sagas
}

export default sagas
