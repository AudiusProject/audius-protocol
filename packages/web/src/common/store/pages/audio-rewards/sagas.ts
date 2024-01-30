import {
  IntKeys,
  StringKeys,
  RemoteConfigInstance,
  getContext,
  stringAudioToStringWei,
  accountSelectors,
  accountActions,
  audioRewardsPageActions,
  ClaimStatus,
  HCaptchaStatus,
  UndisbursedUserChallenge,
  audioRewardsPageSelectors,
  solanaSelectors,
  walletActions,
  modalsActions,
  waitForValue,
  Env,
  musicConfettiActions,
  createUserBankIfNeeded
} from '@audius/common'
import {
  FailureReason,
  UserChallenge,
  StringAudio
} from '@audius/common/models'
import {
  call,
  fork,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
  delay
} from 'typed-redux-saga'

import { isElectron } from 'utils/clientUtil'
import { AUDIO_PAGE } from 'utils/route'
import { waitForRead } from 'utils/sagaHelpers'
import {
  foregroundPollingDaemon,
  visibilityPollingDaemon
} from 'utils/sagaPollingDaemons'
const { show: showMusicConfetti } = musicConfettiActions
const { setVisibility } = modalsActions
const { getBalance, increaseBalance } = walletActions
const { getFeePayer } = solanaSelectors
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
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimChallengeRewardWaitForRetry,
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded,
  setHCaptchaStatus,
  setUserChallengesDisbursed,
  updateHCaptchaScore,
  showRewardClaimedToast,
  claimChallengeRewardAlreadyClaimed,
  setUserChallengeCurrentStepCount,
  resetUserChallengeCurrentStepCount,
  updateOptimisticListenStreak,
  setUndisbursedChallenges
} = audioRewardsPageActions
const fetchAccountSucceeded = accountActions.fetchAccountSucceeded

const { getAccountUser, getUserId } = accountSelectors

const HCAPTCHA_MODAL_NAME = 'HCaptcha'
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
    yield put(
      setVisibility({ modal: CHALLENGE_REWARDS_MODAL_NAME, visible: true })
    )
    if (errorResolved) {
      yield put(claimChallengeReward({ claim, retryOnFailure }))
    } else {
      yield put(claimChallengeRewardFailed())
    }
  }
}

// Returns the number of ms to wait before next retry using exponential backoff
// ie. 400 ms, 800 ms, 1.6 sec, 3.2 sec, 6.4 sec
export const getBackoff = (retryCount: number) => {
  return 200 * 2 ** (retryCount + 1)
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
  const completionPollTimeout = remoteConfigInstance.getRemoteVar(
    IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_TIMEOUT_MS
  )
  const completionPollFrequency = remoteConfigInstance.getRemoteVar(
    IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_FREQUENCY_MS
  )
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

function* claimChallengeRewardAsync(
  action: ReturnType<typeof claimChallengeReward>
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const env = yield* getContext('env')
  const { track } = yield* getContext('analytics')
  const { claim, retryOnFailure, retryCount = 0 } = action.payload
  const { specifiers, challengeId, amount } = claim

  const {
    quorumSize,
    maxClaimRetries,
    oracleEthAddress,
    AAOEndpoint,
    rewardsAttestationEndpoints,
    parallelization,
    completionPollFrequency,
    completionPollTimeout
  } = getClaimingConfig(remoteConfigInstance, env)

  // Do not proceed to claim if challenge is not complete from a DN perspective.
  // This is possible because the client may optimistically set a challenge as complete
  // even though the DN has not yet indexed the change that would mark the challenge as complete.
  // In this case, we wait until the challenge is complete in the DN before claiming
  const challenge = yield* select(getUserChallenge, {
    challengeId
  })
  if (challenge.challenge_type !== 'aggregate' && !challenge.is_complete) {
    console.info('Waiting for challenge completion...')
    const raceResult: { isComplete?: boolean } = yield* race({
      isComplete: call(
        waitForValue,
        getUserChallenge,
        { challengeId },
        (challenge: UserChallenge) => challenge.is_complete
      ),
      poll: call(pollUserChallenges, completionPollFrequency || 1000),
      timeout: delay(completionPollTimeout || 10000)
    })
    if (!raceResult.isComplete) {
      console.warn(
        'Challenge still not marked as completed on DN. Attempting attestations anyway, but may fail...'
      )
    }
  }

  const currentUser = yield* select(getAccountUser)
  const feePayerOverride = yield* select(getFeePayer)

  if (!currentUser || !currentUser.wallet) return

  // Make userbank if necessary
  if (!feePayerOverride) {
    console.error(
      `claimChallengeRewardAsync: unexpectedly no fee payper override`
    )
    return
  }
  yield* call(createUserBankIfNeeded, audiusBackendInstance, {
    recordAnalytics: track,
    feePayerOverride
  })

  // When endpoints is unset, `submitAndEvaluateAttestations` picks for us
  const endpoints =
    rewardsAttestationEndpoints && rewardsAttestationEndpoints !== ''
      ? rewardsAttestationEndpoints.split(',')
      : []
  const hasConfig =
    oracleEthAddress &&
    AAOEndpoint &&
    quorumSize &&
    quorumSize > 0 &&
    maxClaimRetries &&
    !isNaN(maxClaimRetries) &&
    parallelization !== null

  if (!hasConfig) {
    console.error('Error claiming rewards: Config is missing')
    return
  }
  let aaoErrorCode
  try {
    const challenges = specifiers
      .map(({ specifier, amount }) => ({
        challenge_id: challengeId,
        specifier,
        amount
      }))
      .filter(({ amount }) => amount > 0) // We shouldn't have any 0 amount challenges, but just in case.

    const isMobile = yield* getContext('isMobile')
    const response: { error?: string; aaoErrorCode?: number } = yield* call(
      audiusBackendInstance.submitAndEvaluateAttestations,
      {
        challenges,
        userId: currentUser.user_id,
        handle: currentUser.handle,
        recipientEthAddress: currentUser.wallet,
        oracleEthAddress,
        quorumSize,
        endpoints,
        AAOEndpoint,
        parallelization,
        feePayerOverride,
        isFinalAttempt: !retryOnFailure,
        source: isMobile ? 'mobile' : isElectron() ? 'electron' : 'web'
      }
    )
    if (response.error) {
      if (retryOnFailure && retryCount < maxClaimRetries!) {
        switch (response.error) {
          case FailureReason.HCAPTCHA:
            // Hide the Challenge Rewards Modal because the HCaptcha modal doesn't look good on top of it.
            // Will be restored on close of the HCaptcha modal.
            yield put(
              setVisibility({
                modal: CHALLENGE_REWARDS_MODAL_NAME,
                visible: false
              })
            )
            yield put(
              setVisibility({ modal: HCAPTCHA_MODAL_NAME, visible: true })
            )
            yield put(claimChallengeRewardWaitForRetry(claim))
            break

          case FailureReason.ALREADY_DISBURSED:
          case FailureReason.ALREADY_SENT:
            yield put(claimChallengeRewardAlreadyClaimed())
            break
          case FailureReason.BLOCKED:
            aaoErrorCode = response.aaoErrorCode
            throw new Error('User is blocked from claiming')
          // For these 'attestation aggregation errors',
          // we've already retried in libs so unlikely to succeed here.
          case FailureReason.AAO_ATTESTATION_UNKNOWN_RESPONSE:
          case FailureReason.MISSING_CHALLENGES:
          case FailureReason.CHALLENGE_INCOMPLETE:
            yield put(claimChallengeRewardFailed())
            break
          case FailureReason.WAIT_FOR_COOLDOWN:
            yield put(claimChallengeRewardFailed())
            break
          case FailureReason.UNKNOWN_ERROR:
          default:
            // If there is an AAO error code, then the AAO must have
            // rejected this user so don't retry.
            aaoErrorCode = response.aaoErrorCode
            if (aaoErrorCode !== undefined) {
              yield put(claimChallengeRewardFailed({ aaoErrorCode }))
              break
            }

            // If this was an aggregate challenges with multiple specifiers,
            // then libs handles the retries and we shouldn't retry here.
            if (specifiers.length > 1) {
              yield put(claimChallengeRewardFailed())
              break
            }
            yield delay(getBackoff(retryCount))
            yield put(
              claimChallengeReward({
                claim,
                retryOnFailure: true,
                retryCount: retryCount + 1
              })
            )
        }
      } else {
        aaoErrorCode = response.aaoErrorCode
        if (aaoErrorCode !== undefined) {
          yield put(claimChallengeRewardFailed({ aaoErrorCode }))
        } else {
          yield put(claimChallengeRewardFailed())
        }
      }
    } else {
      yield put(
        increaseBalance({
          amount: stringAudioToStringWei(amount.toString() as StringAudio)
        })
      )
      yield put(setUserChallengesDisbursed({ challengeId, specifiers }))
      yield put(claimChallengeRewardSucceeded())
    }
  } catch (e) {
    console.error('Error claiming rewards:', e)
    if (aaoErrorCode !== undefined) {
      yield put(claimChallengeRewardFailed({ aaoErrorCode }))
    } else {
      yield put(claimChallengeRewardFailed())
    }
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

function* fetchUserChallengesAsync() {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  try {
    const userChallenges: UserChallenge[] = yield call(
      apiClient.getUserChallenges,
      {
        userID: currentUserId
      }
    )
    const undisbursedChallenges: UndisbursedUserChallenge[] = yield call(
      [apiClient, apiClient.getUndisbursedUserChallenges],
      { userID: currentUserId }
    )
    yield put(fetchUserChallengesSucceeded({ userChallenges }))
    yield put(setUndisbursedChallenges(undisbursedChallenges ?? []))
  } catch (e) {
    console.error(e)
    yield put(fetchUserChallengesFailed())
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
    yield put(getBalance())
    yield put(showMusicConfetti())
    yield put(showRewardClaimedToast())
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
    yield put(
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
      yield put(
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
      const result = yield* call(
        audiusBackendInstance.updateHCaptchaScore,
        token
      )
      if (result.error) {
        yield put(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
      } else {
        yield put(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
      }
    }
  )
}

function* pollUserChallenges(frequency: number) {
  while (true) {
    yield put(fetchUserChallenges())
    yield delay(frequency)
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

  yield take(fetchAccountSucceeded.type)
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
    watchSetHCaptchaStatus,
    watchUpdateHCaptchaScore,
    userChallengePollingDaemon,
    watchUpdateOptimisticListenStreak
  ]
  return sagas
}

export default sagas
