import {
  FailureReason,
  UserChallenge,
  ChallengeRewardID,
  StringAudio
} from '@audius/common/models'
import { IntKeys, StringKeys } from '@audius/common/services'
import {
  accountSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  HCaptchaStatus,
  ClaimStatus,
  solanaSelectors,
  walletActions,
  modalsActions,
  AudioRewardsClaim
} from '@audius/common/store'
import { stringAudioToStringWei } from '@audius/common/utils'
import delayP from '@redux-saga/delay-p'
import { all, fork } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { beforeAll, describe, it, vitest } from 'vitest'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
// Need the mock type to get the helper function that sets the config
// eslint-disable-next-line jest/no-mocks-import
import { MockRemoteConfigInstance } from 'services/remote-config/__mocks__/remote-config-instance'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import rewardsSagas from './sagas'
const { setVisibility } = modalsActions
const { getBalance, increaseBalance } = walletActions
const { getFeePayer } = solanaSelectors
const {
  getClaimStatus,
  getClaimToRetry,
  getUserChallenge,
  getUserChallenges,
  getUserChallengesOverrides,
  getUserChallengeSpecifierMap
} = audioRewardsPageSelectors
const {
  claimChallengeReward,
  claimChallengeRewardAlreadyClaimed,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  claimChallengeRewardWaitForRetry,
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  resetUserChallengeCurrentStepCount,
  setHCaptchaStatus,
  setUserChallengesDisbursed,
  showRewardClaimedToast
} = audioRewardsPageActions
const { getAccountUser, getUserHandle, getUserId } = accountSelectors

// Setup mocks
vitest.mock('services/remote-config/remote-config-instance')
vitest.mock('utils/route/hashIds')
vitest.mock('services/AudiusBackend')
vitest.mock('services/audius-api-client/AudiusAPIClient')
vitest.mock('utils/sagaPollingDaemons')

function* saga() {
  yield all(rewardsSagas().map(fork))
}

const testClaim: AudioRewardsClaim = {
  challengeId: 'connect-verified',
  specifiers: [{ specifier: '1', amount: 10 }],
  amount: 10
}
const testUser = {
  user_id: 1,
  handle: 'test_user',
  wallet: 'test-wallet'
}
const testUserChallenge = {
  challenge_id: 'connect-verified' as ChallengeRewardID,
  amount: 1,
  is_complete: true
}
const testFeePayer = '9AwMCALjKFp2ZQW97rnjJUzUiukzkGAH4HDz5V2uhW3D'

const claimAsyncProvisions: StaticProvider[] = [
  [select(getAccountUser), testUser],
  [
    select.like({
      selector: getUserChallenge,
      args: [{ challengeId: testUserChallenge.challenge_id }]
    }),
    testUserChallenge
  ],
  [select(getFeePayer), testFeePayer]
]

const retryClaimProvisions: StaticProvider[] = [
  [select(getClaimStatus), ClaimStatus.WAITING_FOR_RETRY],
  [select(getClaimToRetry), testClaim]
]

const MAX_CLAIM_RETRIES = 5

const expectedRequestArgs = {
  challenges: [{ challenge_id: 'connect-verified', specifier: '1' }],
  userId: 1,
  handle: 'test_user',
  recipientEthAddress: 'test-wallet',
  oracleEthAddress: 'oracle eth address',
  amount: 10,
  quorumSize: 1,
  endpoints: ['rewards attestation endpoints'],
  AAOEndpoint: 'oracle endpoint',
  parallelization: 20,
  feePayerOverride: testFeePayer,
  isFinalAttempt: false
}
beforeAll(() => {
  // Setup remote config
  ;(remoteConfigInstance as MockRemoteConfigInstance).__setConfig({
    [IntKeys.ATTESTATION_QUORUM_SIZE]: 1,
    [StringKeys.ORACLE_ETH_ADDRESS]: 'oracle eth address',
    [StringKeys.ORACLE_ENDPOINT]: 'oracle endpoint',
    [StringKeys.REWARDS_ATTESTATION_ENDPOINTS]: 'rewards attestation endpoints',
    [IntKeys.CHALLENGE_REFRESH_INTERVAL_AUDIO_PAGE_MS]: 100000000000,
    [IntKeys.CHALLENGE_REFRESH_INTERVAL_MS]: 1000000000000,
    [IntKeys.MAX_CLAIM_RETRIES]: MAX_CLAIM_RETRIES,
    [IntKeys.CLIENT_ATTESTATION_PARALLELIZATION]: 20
  })
  remoteConfigInstance.waitForRemoteConfig = vitest.fn()

  // Hijack console.error for expected errors
  const oldConsoleError = console.error
  vitest.spyOn(console, 'error').mockImplementation((...args: any) => {
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
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.HCAPTCHA }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
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

    it('should fail and not retry nor open modals on user blocked', () => {
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
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.BLOCKED }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .not.put(claimChallengeRewardWaitForRetry(testClaim))
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

    it('should fail and inform the user when already disbursed', () => {
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
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.ALREADY_DISBURSED }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .put(claimChallengeRewardAlreadyClaimed())
          .silentRun()
      )
    })

    it('should fail and retry when already sent', () => {
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
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.ALREADY_SENT }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .put(claimChallengeRewardAlreadyClaimed())
          .silentRun()
      )
    })

    it('should attempt retry if below max retries', () => {
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
            [call.fn(delayP), null],
            [
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.UNKNOWN_ERROR }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
          .put(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true,
              retryCount: 1
            })
          )
          .silentRun()
      )
    })

    it('should not attempt retry if at max retries', () => {
      return (
        expectSaga(saga)
          .dispatch(
            claimChallengeReward({
              claim: testClaim,
              retryOnFailure: true,
              retryCount: MAX_CLAIM_RETRIES
            })
          )
          .provide([
            ...claimAsyncProvisions,
            [
              call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
              { error: FailureReason.UNKNOWN_ERROR }
            ]
          ])
          // Assertions
          .call.like({
            fn: audiusBackendInstance.submitAndEvaluateAttestations,
            args: [expectedRequestArgs]
          })
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
            [call.fn(audiusBackendInstance.submitAndEvaluateAttestations), {}]
          ])
          // Assertions
          .put(
            increaseBalance({
              amount: stringAudioToStringWei('10' as StringAudio)
            })
          )
          .put(
            setUserChallengesDisbursed({
              challengeId: testClaim.challengeId,
              specifiers: testClaim.specifiers
            })
          )
          .put(claimChallengeRewardSucceeded())
          .silentRun()
      )
    })

    it('should NOT submit attestation if DN has not marked the challenge as complete', () => {
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
            ],
            [select(getUserChallenges), {}],
            [select(getUserChallengesOverrides), {}],
            [call.fn(waitForBackendSetup), {}],
            [select(getUserId), testUser.user_id]
          ])
          // Assertions
          .not.call(audiusBackendInstance.submitAndEvaluateAttestations)
          .not.put(
            setUserChallengesDisbursed({
              challengeId: testClaim.challengeId,
              specifiers: testClaim.specifiers
            })
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
          [call.fn(audiusBackendInstance.submitAndEvaluateAttestations), {}]
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
          [call.fn(audiusBackendInstance.submitAndEvaluateAttestations), {}]
        ])
        .put(claimChallengeReward({ claim: testClaim, retryOnFailure: true }))
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

    it('should not retry twice', () => {
      return expectSaga(saga)
        .provide([
          ...retryClaimProvisions,
          ...claimAsyncProvisions,
          [select(getUserHandle), testUser.handle],
          [
            call.fn(audiusBackendInstance.submitAndEvaluateAttestations),
            { error: FailureReason.BLOCKED }
          ]
        ])
        .put(claimChallengeReward({ claim: testClaim, retryOnFailure: false }))
        .call(audiusBackendInstance.submitAndEvaluateAttestations, {
          ...expectedRequestArgs,
          isFinalAttempt: true
        })
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
        user_id: '1',
        disbursed_amount: 7
      },
      {
        challenge_id: 'referrals',
        is_complete: true,
        is_disbursed: false,
        is_active: true,
        amount: 1,
        current_step_count: 5,
        max_steps: 5,
        challenge_type: 'numeric',
        specifier: '1',
        user_id: '1',
        disbursed_amount: 5
      },
      {
        challenge_id: 'track-upload',
        is_complete: true,
        is_disbursed: true,
        is_active: true,
        amount: 1,
        current_step_count: 3,
        max_steps: 3,
        challenge_type: 'numeric',
        specifier: '1',
        user_id: '1',
        disbursed_amount: 3
      }
    ]
    const fetchUserChallengesProvisions: StaticProvider[] = [
      [call.fn(waitForBackendSetup), {}],
      [select(getUserId), testUser.user_id],
      [call.fn(apiClient.getUserChallenges), expectedUserChallengesResponse]
    ]
    it('should show a toast to the user that they received a reward if the reward was not disbursed yet', () => {
      return expectSaga(saga)
        .dispatch(fetchUserChallenges())
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallengeSpecifierMap),
            {
              'profile-completion': {
                [testUser.user_id]: {
                  is_complete: true,
                  is_disbursed: false
                }
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
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallengeSpecifierMap),
            {
              'profile-completion': {
                [testUser.user_id]: {
                  is_complete: true,
                  is_disbursed: true
                }
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
        .provide([
          ...fetchUserChallengesProvisions,
          [
            select(getUserChallengeSpecifierMap),
            {
              [testUser.user_id]: {
                referrals: {
                  is_complete: true,
                  is_disbursed: false
                }
              }
            }
          ],
          [
            select(getUserChallengesOverrides),
            {
              referrals: {
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

    const listenStreakUserChallenge: UserChallenge[] = [
      {
        challenge_id: 'listen-streak',
        is_complete: true,
        is_disbursed: true,
        is_active: true,
        amount: 1,
        current_step_count: 0,
        max_steps: 7,
        challenge_type: 'numeric',
        specifier: '1',
        user_id: '1',
        disbursed_amount: 7
      }
    ]

    it('should not reset the listen streak override', () => {
      return expectSaga(saga)
        .dispatch(
          fetchUserChallengesSucceeded({
            userChallenges: listenStreakUserChallenge
          })
        )
        .provide([
          [
            select(getUserChallengeSpecifierMap),
            {
              'listen-streak': {
                [testUser.user_id]: {
                  current_step_count: 0,
                  is_complete: false,
                  is_disbursed: false
                }
              }
            }
          ],
          [
            select(getUserChallengesOverrides),
            {
              'listen-streak': {
                current_step_count: 1
              }
            }
          ]
        ])
        .not.put(
          resetUserChallengeCurrentStepCount({
            challengeId: 'listen-streak'
          })
        )
        .silentRun()
    })

    const listenStreakUserChallengeStepCountUp: UserChallenge[] = [
      {
        challenge_id: 'listen-streak',
        is_complete: true,
        is_disbursed: true,
        is_active: true,
        amount: 1,
        current_step_count: 2,
        max_steps: 7,
        challenge_type: 'numeric',
        specifier: '1',
        user_id: '1',
        disbursed_amount: 2
      }
    ]

    it('should reset the listen streak override to zero', () => {
      return expectSaga(saga)
        .dispatch(
          fetchUserChallengesSucceeded({
            userChallenges: listenStreakUserChallengeStepCountUp
          })
        )
        .provide([
          [
            select(getUserChallengeSpecifierMap),
            {
              'listen-streak': {
                [testUser.user_id]: {
                  current_step_count: 0,
                  is_complete: false,
                  is_disbursed: false
                }
              }
            }
          ],
          [
            select(getUserChallengesOverrides),
            {
              'listen-streak': {
                current_step_count: 1
              }
            }
          ]
        ])
        .put(
          resetUserChallengeCurrentStepCount({
            challengeId: 'listen-streak'
          })
        )
        .silentRun()
    })
  })
})
