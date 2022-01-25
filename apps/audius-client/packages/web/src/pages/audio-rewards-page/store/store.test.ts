import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { all, fork } from 'redux-saga/effects'

import { FailureReason, UserChallenge } from 'common/models/AudioRewards'
import { StringAudio } from 'common/models/Wallet'
import { IntKeys, StringKeys } from 'common/services/remote-config'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import {
  getClaimStatus,
  getClaimToRetry,
  getUserChallenge,
  getUserChallenges,
  getUserChallengesOverrides
} from 'common/store/pages/audio-rewards/selectors'
import {
  Claim,
  claimChallengeReward,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimChallengeRewardWaitForRetry,
  ClaimStatus,
  CognitoFlowStatus,
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  HCaptchaStatus,
  setCognitoFlowStatus,
  setHCaptchaStatus,
  setUserChallengeDisbursed,
  showRewardClaimedToast
} from 'common/store/pages/audio-rewards/slice'
import { setVisibility } from 'common/store/ui/modals/slice'
import { getBalance, increaseBalance } from 'common/store/wallet/slice'
import { stringAudioToStringWei } from 'common/utils/wallet'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
// Need the mock type to get the helper function that sets the config
// eslint-disable-next-line jest/no-mocks-import
import { MockRemoteConfigInstance } from 'services/remote-config/__mocks__/remote-config-instance'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { getIsReachable } from 'store/reachability/selectors'

import rewardsSagas from './sagas'

// Setup mocks
jest.mock('services/remote-config/remote-config-instance')
jest.mock('utils/route/hashIds')
jest.mock('services/AudiusBackend')
jest.mock('services/audius-api-client/AudiusAPIClient')
jest.mock('utils/sagaPollingDaemons')

function* saga() {
  yield all(rewardsSagas().map(fork))
}

const testClaim: Claim = {
  challengeId: 'connect-verified',
  specifier: '1',
  amount: 10
}
const testUser = {
  user_id: 1,
  handle: 'test_user',
  wallet: 'test-wallet'
}
const testUserChallenge = {
  challenge_id: 'connect-verified',
  amount: 1,
  is_complete: true
}

const claimAsyncProvisions: StaticProvider[] = [
  [select(getAccountUser), testUser],
  [
    select.like({
      selector: getUserChallenge,
      args: [{ challengeId: testUserChallenge.challenge_id }]
    }),
    testUserChallenge
  ]
]

const retryClaimProvisions: StaticProvider[] = [
  [select(getClaimStatus), ClaimStatus.WAITING_FOR_RETRY],
  [select(getClaimToRetry), testClaim]
]

const expectedRequestArgs = {
  ...testClaim,
  encodedUserId: undefined,
  handle: 'test_user',
  recipientEthAddress: 'test-wallet',
  oracleEthAddress: 'oracle eth address',
  quorumSize: 1,
  endpoints: ['rewards attestation endpoints'],
  AAOEndpoint: 'oracle endpoint'
}
beforeAll(() => {
  // Setup remote config
  ;(remoteConfigInstance as MockRemoteConfigInstance).__setConfig({
    [IntKeys.ATTESTATION_QUORUM_SIZE]: 1,
    [StringKeys.ORACLE_ETH_ADDRESS]: 'oracle eth address',
    [StringKeys.ORACLE_ENDPOINT]: 'oracle endpoint',
    [StringKeys.REWARDS_ATTESTATION_ENDPOINTS]: 'rewards attestation endpoints',
    [IntKeys.CHALLENGE_REFRESH_INTERVAL_AUDIO_PAGE_MS]: 100000000000,
    [IntKeys.CHALLENGE_REFRESH_INTERVAL_MS]: 1000000000000
  })
  remoteConfigInstance.waitForRemoteConfig = jest.fn()

  // Hijack console.error for expected errors
  const oldConsoleError = console.error
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      args &&
      (args.length <= 1 ||
        args[1].toString().indexOf('User is blocked from claiming') < 0)
    ) {
      oldConsoleError(args)
    }
  })
})

describe('Rewards Page Sagas', () => {
  describe('Claim Rewards Async', () => {
    it('should open hcaptcha modal, close the challenges modal, and save the claim for retry on hcaptcha error', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true
            })
          )
          .provide([
            ...claimAsyncProvisions,
            [
              call.fn(AudiusBackend.submitAndEvaluateAttestations),
              { error: FailureReason.HCAPTCHA }
            ]
          ])
          // Assertions
          .call.like({
            fn: AudiusBackend.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .put(claimChallengeRewardWaitForRetry(testClaim))
          .put(setVisibility({ modal: 'HCaptcha', visible: true }))
          .put(
            setVisibility({
              modal: 'ChallengeRewardsExplainer',
              visible: false
            })
          )
          .silentRun()
      )
    })

    it('should open cognito modal and save the claim for retry on cognito error', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true
            })
          )
          .provide([
            ...claimAsyncProvisions,
            [
              call.fn(AudiusBackend.submitAndEvaluateAttestations),
              { error: FailureReason.COGNITO_FLOW }
            ]
          ])
          // Assertions
          .call.like({
            fn: AudiusBackend.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .put(claimChallengeRewardWaitForRetry(testClaim))
          .put(setVisibility({ modal: 'Cognito', visible: true }))
          .not.put(
            setVisibility({
              modal: 'ChallengeRewardsExplainer',
              visible: false
            })
          )
          .silentRun()
      )
    })

    it('should fail and not retry nor open models on user blocked', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true
            })
          )
          .provide([
            ...claimAsyncProvisions,
            [
              call.fn(AudiusBackend.submitAndEvaluateAttestations),
              { error: FailureReason.BLOCKED }
            ]
          ])
          // Assertions
          .call.like({
            fn: AudiusBackend.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .not.put(claimChallengeRewardWaitForRetry(testClaim))
          .not.put(setVisibility({ modal: 'Cognito', visible: true }))
          .not.put(
            setVisibility({
              modal: 'ChallengeRewardsExplainer',
              visible: false
            })
          )
          .put(claimChallengeRewardFailed())
          .silentRun()
      )
    })

    it('should update the audio balance and disbursement status on success', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true
            })
          )
          .provide([
            ...claimAsyncProvisions,
            [call.fn(AudiusBackend.submitAndEvaluateAttestations), {}]
          ])
          // Assertions
          .put(
            increaseBalance({
              amount: stringAudioToStringWei('10' as StringAudio)
            })
          )
          .put(setUserChallengeDisbursed({ challengeId: 'connect-verified' }))
          .put(claimChallengeRewardSucceeded())
          .silentRun()
      )
    })

    it('should wait until discovery marked the challenge as completed before submitting', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true
            })
          )
          .provide([
            [
              select.like({
                selector: getUserChallenge,
                args: [{ challengeId: testUserChallenge.challenge_id }]
              }),
              { is_completed: false }
            ]
          ])
          // Assertions
          .not.call(AudiusBackend.submitAndEvaluateAttestations)
          .not.put(
            setUserChallengeDisbursed({ challengeId: 'connect-verified' })
          )
          .not.put(claimChallengeRewardSucceeded())
          .silentRun()
      )
    })
  })

  describe('Claim Rewards Retries', () => {
    it('should reopen the challenge rewards modal on successful hcaptcha', () => {
      return expectSaga(saga)
        .dispatch(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
        .provide([
          ...retryClaimProvisions,
          ...claimAsyncProvisions,
          [call.fn(AudiusBackend.submitAndEvaluateAttestations), {}]
        ])
        .put(
          setVisibility({ modal: 'ChallengeRewardsExplainer', visible: true })
        )
        .silentRun()
    })

    it('should retry the claim on successful hcaptcha', () => {
      return expectSaga(saga)
        .dispatch(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
        .provide([
          ...retryClaimProvisions,
          ...claimAsyncProvisions,
          [call.fn(AudiusBackend.submitAndEvaluateAttestations), {}]
        ])
        .put(claimChallengeReward({ claim: testClaim, retryOnFailure: false }))
        .put(claimChallengeRewardSucceeded())
        .silentRun()
    })

    it('should not retry the claim on failed/closed hcaptcha', () => {
      return Promise.all([
        // Failed
        expectSaga(saga)
          .dispatch(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
          .provide([...retryClaimProvisions, ...claimAsyncProvisions])
          .not.put(
            claimChallengeReward({ claim: testClaim, retryOnFailure: false })
          )
          .put(claimChallengeRewardFailed())
          .silentRun(10),
        // Closed
        expectSaga(saga)
          .dispatch(setHCaptchaStatus({ status: HCaptchaStatus.USER_CLOSED }))
          .provide([...retryClaimProvisions, ...claimAsyncProvisions])
          .not.put(
            claimChallengeReward({ claim: testClaim, retryOnFailure: false })
          )
          .put(claimChallengeRewardFailed())
          .silentRun()
      ])
    })

    it('should retry the claim on cognito close', () => {
      return expectSaga(saga)
        .dispatch(setCognitoFlowStatus({ status: CognitoFlowStatus.CLOSED }))
        .provide([
          ...retryClaimProvisions,
          ...claimAsyncProvisions,
          [call.fn(AudiusBackend.submitAndEvaluateAttestations), {}]
        ])
        .put(claimChallengeReward({ claim: testClaim, retryOnFailure: false }))
        .put(claimChallengeRewardSucceeded())
        .silentRun()
    })

    it('should not retry twice', () => {
      return expectSaga(saga)
        .dispatch(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
        .provide([
          ...retryClaimProvisions,
          ...claimAsyncProvisions,
          [
            call.fn(AudiusBackend.submitAndEvaluateAttestations),
            { error: FailureReason.BLOCKED }
          ]
        ])
        .put(claimChallengeReward({ claim: testClaim, retryOnFailure: false }))
        .call(AudiusBackend.submitAndEvaluateAttestations, expectedRequestArgs)
        .not.put(claimChallengeRewardWaitForRetry(testClaim))
        .put(claimChallengeRewardFailed())
        .silentRun()
    })
  })
  describe('Fetch User Challenges', () => {
    const expectedUserChallengesResponse: UserChallenge[] = [
      {
        challenge_id: 'profile-completion',
        is_complete: true,
        is_disbursed: true,
        is_active: true,
        amount: 1,
        current_step_count: 7,
        max_steps: 7,
        challenge_type: 'numeric',
        specifier: '1',
        user_id: '1'
      }
    ]
    const fetchUserChallengesProvisions: StaticProvider[] = [
      [select(getIsReachable), true],
      [select(getUserId), testUser.user_id],
      [call.fn(apiClient.getUserChallenges), expectedUserChallengesResponse]
    ]
    const defaultState = {
      backend: { isSetup: true }
    }
    it('should show a toast to the user that they received a reward if the reward was not disbursed yet', () => {
      return expectSaga(saga)
        .dispatch(fetchUserChallenges())
        .withState(defaultState)
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallenges),
            {
              'profile-completion': {
                is_complete: true,
                is_disbursed: false
              }
            }
          ],
          [select(getUserChallengesOverrides), {}]
        ])
        .put(getBalance())
        .put(showRewardClaimedToast())
        .put(
          fetchUserChallengesSucceeded({
            userChallenges: expectedUserChallengesResponse
          })
        )
        .silentRun()
    })

    it('should NOT show a toast to the user that they received a reward if the reward was already automatically claimed', () => {
      return expectSaga(saga)
        .dispatch(fetchUserChallenges())
        .withState(defaultState)
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallenges),
            {
              'profile-completion': {
                is_complete: true,
                is_disbursed: true
              }
            }
          ],
          [select(getUserChallengesOverrides), {}]
        ])
        .not.put(showRewardClaimedToast())
        .put(
          fetchUserChallengesSucceeded({
            userChallenges: expectedUserChallengesResponse
          })
        )
        .silentRun()
    })

    it('should NOT show a toast to the user that they received a reward if the reward was already manually claimed', () => {
      return expectSaga(saga)
        .dispatch(fetchUserChallenges())
        .withState(defaultState)
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallenges),
            {
              'profile-completion': {
                is_complete: true,
                is_disbursed: false
              }
            }
          ],
          [
            select(getUserChallengesOverrides),
            {
              'profile-completion': {
                is_disbursed: true
              }
            }
          ]
        ])
        .not.put(showRewardClaimedToast())
        .put(
          fetchUserChallengesSucceeded({
            userChallenges: expectedUserChallengesResponse
          })
        )
        .silentRun()
    })
  })
})
