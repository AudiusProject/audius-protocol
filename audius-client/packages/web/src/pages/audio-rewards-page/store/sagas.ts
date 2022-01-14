import { User } from '@sentry/browser'
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects'

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
  getClaimToRetry
} from 'common/store/pages/audio-rewards/selectors'
import {
  HCaptchaStatus,
  setHCaptchaStatus,
  updateHCaptchaScore,
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded,
  ClaimStatus,
  CognitoFlowStatus,
  setCognitoFlowStatus,
  setUserChallengeDisbursed,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimChallengeReward,
  claimChallengeRewardWaitForRetry
} from 'common/store/pages/audio-rewards/slice'
import { setVisibility } from 'common/store/ui/modals/slice'
import { increaseBalance } from 'common/store/wallet/slice'
import { stringAudioToStringWei } from 'common/utils/wallet'
import mobileSagas from 'pages/audio-rewards-page/store/mobileSagas'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { waitForBackendSetup } from 'store/backend/sagas'
import { encodeHashId } from 'utils/route/hashIds'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILEconst
const HCAPTCHA_MODAL_NAME = 'HCaptcha'
// TODO: Restore when Cognito modal is added
// const COGNITO_MODAL_NAME = 'Cognito'
const CHALLENGE_REWARDS_MODAL_NAME = 'ChallengeRewardsExplainer'

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
  const quorumSize = remoteConfigInstance.getRemoteVar(
    IntKeys.ATTESTATION_QUORUM_SIZE
  )
  const oracleEthAddress = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ETH_ADDRESS
  )
  const AAOEndpoint = remoteConfigInstance.getRemoteVar(
    StringKeys.ORACLE_ENDPOINT
  )

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
            // TODO: Uncomment once Cognito Modal is added
            // yield put(
            //   setVisibility({ modal: COGNITO_MODAL_NAME, visible: true })
            // )
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

const sagas = () => {
  const sagas = [
    watchFetchUserChallenges,
    watchClaimChallengeReward,
    watchSetHCaptchaStatus,
    watchSetCognitoFlowStatus,
    watchUpdateHCaptchaScore
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
