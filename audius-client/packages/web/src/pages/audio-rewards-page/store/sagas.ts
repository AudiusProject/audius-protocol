import { User } from '@sentry/browser'
import {
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import {
  ChallengeRewardID,
  FailureReason,
  UserChallenge
} from 'common/models/AudioRewards'
import { StringAudio } from 'common/models/Wallet'
import { IntKeys, StringKeys } from 'common/services/remote-config'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import {
  getClaimStatus,
  getClaimToRetry,
  getUserChallenge
} from 'common/store/pages/audio-rewards/selectors'
import {
  claimChallengeReward,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimChallengeRewardWaitForRetry,
  ClaimStatus,
  CognitoFlowStatus,
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded,
  HCaptchaStatus,
  refreshUserBalance,
  refreshUserChallenges,
  reset,
  setCognitoFlowStatus,
  setHCaptchaStatus,
  setUserChallengeDisbursed,
  updateHCaptchaScore
} from 'common/store/pages/audio-rewards/slice'
import { setVisibility } from 'common/store/ui/modals/slice'
import { getBalance, increaseBalance } from 'common/store/wallet/slice'
import { stringAudioToStringWei } from 'common/utils/wallet'
import mobileSagas from 'pages/audio-rewards-page/store/mobileSagas'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { encodeHashId } from 'utils/route/hashIds'
import { doEvery, waitForValue } from 'utils/sagaHelpers'

const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT
const REACT_APP_ORACLE_ETH_ADDRESSES =
  process.env.REACT_APP_ORACLE_ETH_ADDRESSES
const REACT_APP_AAO_ENDPOINT = process.env.REACT_APP_AAO_ENDPOINT
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const HCAPTCHA_MODAL_NAME = 'HCaptcha'
const COGNITO_MODAL_NAME = 'Cognito'
const CHALLENGE_REWARDS_MODAL_NAME = 'ChallengeRewardsExplainer'

function getOracleConfig() {
  let oracleEthAddress = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ETH_ADDRESS
  )
  let AAOEndpoint = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ENDPOINT
  )
  if (ENVIRONMENT === 'development') {
    const oracleEthAddresses = (REACT_APP_ORACLE_ETH_ADDRESSES || '').split(',')
    if (oracleEthAddresses.length > 0) {
      oracleEthAddress = oracleEthAddresses[0]
    }
    if (REACT_APP_AAO_ENDPOINT) {
      AAOEndpoint = REACT_APP_AAO_ENDPOINT
    }
  }

  return { oracleEthAddress, AAOEndpoint }
}

function* retryClaimChallengeReward(errorResolved: boolean) {
  const claimStatus: ClaimStatus = yield select(getClaimStatus)
  const claim: {
    challengeId: ChallengeRewardID
    amount: number
    specifier: string
  } = yield select(getClaimToRetry)
  if (claimStatus === ClaimStatus.WAITING_FOR_RETRY) {
    // Restore the challenge rewards modal if necessary
    yield put(
      setVisibility({ modal: CHALLENGE_REWARDS_MODAL_NAME, visible: true })
    )
    if (errorResolved) {
      yield put(claimChallengeReward({ claim, retryOnFailure: false }))
    } else {
      yield put(claimChallengeRewardFailed())
    }
  }
}

function* claimChallengeRewardAsync(
  action: ReturnType<typeof claimChallengeReward>
) {
  const { claim, retryOnFailure } = action.payload
  const { specifier, challengeId, amount } = claim

  // Do not proceed to claim if challenge is not complete from a DN perspective.
  // This is possible because the client may optimistically set a challenge as complete
  // even though the DN has not yet indexed the change that would mark the challenge as complete.
  // In this case, we wait until the challenge is complete in the DN before claiming
  yield call(
    waitForValue,
    getUserChallenge,
    { challengeId },
    (challenge: UserChallenge) => challenge.is_complete
  )

  const quorumSize = remoteConfigInstance.getRemoteVar(
    IntKeys.ATTESTATION_QUORUM_SIZE
  )
  const { oracleEthAddress, AAOEndpoint } = getOracleConfig()

  const rewardsAttestationEndpoints = remoteConfigInstance.getRemoteVar(
    StringKeys.REWARDS_ATTESTATION_ENDPOINTS
  )
  const currentUser: User = yield select(getAccountUser)

  // When endpoints is unset, `submitAndEvaluateAttestations` picks for us
  const endpoints = rewardsAttestationEndpoints?.split(',') || null
  const hasConfig =
    oracleEthAddress && AAOEndpoint && quorumSize && quorumSize > 0

  if (!hasConfig) {
    console.error('Error claiming rewards: Config is missing')
    return
  }
  try {
    const response: { error?: string } = yield call(
      AudiusBackend.submitAndEvaluateAttestations,
      {
        challengeId,
        encodedUserId: encodeHashId(currentUser.user_id),
        handle: currentUser.handle,
        recipientEthAddress: currentUser.wallet,
        specifier,
        oracleEthAddress,
        amount,
        quorumSize,
        endpoints,
        AAOEndpoint
      }
    )
    if (response.error) {
      if (retryOnFailure) {
        yield put(claimChallengeRewardWaitForRetry(claim))
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
            break
          case FailureReason.COGNITO_FLOW:
            yield put(
              setVisibility({ modal: COGNITO_MODAL_NAME, visible: true })
            )
            break
          case FailureReason.BLOCKED:
            throw new Error('User is blocked from claiming')
          case FailureReason.UNKNOWN_ERROR:
          default:
            throw new Error(`Unknown Error: ${response.error}`)
        }
      } else {
        yield put(claimChallengeRewardFailed())
      }
    } else {
      yield put(
        increaseBalance({
          amount: stringAudioToStringWei(amount.toString() as StringAudio)
        })
      )
      yield put(setUserChallengeDisbursed({ challengeId }))
      yield put(claimChallengeRewardSucceeded())
    }
  } catch (e) {
    console.error('Error claiming rewards:', e)
    yield put(claimChallengeRewardFailed())
  }
}

function* watchSetHCaptchaStatus() {
  yield takeLatest(setHCaptchaStatus.type, function* (
    action: ReturnType<typeof setHCaptchaStatus>
  ) {
    const { status } = action.payload
    yield call(retryClaimChallengeReward, status === HCaptchaStatus.SUCCESS)
  })
}

function* watchSetCognitoFlowStatus() {
  yield takeLatest(setCognitoFlowStatus.type, function* (
    action: ReturnType<typeof setCognitoFlowStatus>
  ) {
    const { status } = action.payload
    // Only attempt retry on closed, so that we don't error on open
    if (status === CognitoFlowStatus.CLOSED) {
      yield call(retryClaimChallengeReward, true)
    }
  })
}

function* watchClaimChallengeReward() {
  yield takeLatest(claimChallengeReward.type, claimChallengeRewardAsync)
}

export function* watchFetchUserChallenges() {
  yield takeEvery(fetchUserChallenges.type, function* () {
    yield call(waitForBackendSetup)
    const currentUserId: number = yield select(getUserId)

    try {
      const userChallenges: UserChallenge[] = yield apiClient.getUserChallenges(
        {
          userID: currentUserId
        }
      )
      yield put(fetchUserChallengesSucceeded({ userChallenges }))
    } catch (e) {
      console.error(e)
      yield put(fetchUserChallengesFailed())
    }
  })
}

function* watchUpdateHCaptchaScore() {
  yield takeEvery(updateHCaptchaScore.type, function* (
    action: ReturnType<typeof updateHCaptchaScore>
  ): any {
    const { token } = action.payload
    const result = yield call(AudiusBackend.updateHCaptchaScore, token)
    if (result.error) {
      yield put(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
    } else {
      yield put(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
    }
  })
}

function* pollForChallenges(): any {
  const pollingFreq = remoteConfigInstance.getRemoteVar(
    IntKeys.CHALLENGE_REFRESH_INTERVAL_MS
  )
  if (pollingFreq) {
    const chan = yield call(doEvery, pollingFreq, function* () {
      yield put(fetchUserChallenges())
    })
    yield take(reset.type)
    chan.close()
  }
}

function* pollForBalance(): any {
  const pollingFreq = remoteConfigInstance.getRemoteVar(
    IntKeys.REWARDS_WALLET_BALANCE_POLLING_FREQ_MS
  )
  if (pollingFreq) {
    const chan = yield call(doEvery, pollingFreq, function* () {
      yield put(getBalance())
    })
    yield take(reset.type)
    chan.close()
  }
}

function* watchRefreshUserChallenges() {
  yield takeEvery(refreshUserChallenges.type, pollForChallenges)
}

function* watchRefreshUserBalance() {
  yield takeEvery(refreshUserBalance.type, pollForBalance)
}

const sagas = () => {
  const sagas = [
    watchFetchUserChallenges,
    watchClaimChallengeReward,
    watchSetHCaptchaStatus,
    watchSetCognitoFlowStatus,
    watchUpdateHCaptchaScore,
    watchRefreshUserChallenges,
    watchRefreshUserBalance
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
