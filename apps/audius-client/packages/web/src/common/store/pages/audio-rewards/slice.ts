import {
  Status,
  UserChallenge,
  ChallengeRewardID,
  Specifier
} from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type TrendingRewardsModalType = 'tracks' | 'playlists' | 'underground'
export type ChallengeRewardsModalType = ChallengeRewardID

export enum ClaimStatus {
  NONE = 'none',
  CLAIMING = 'claiming',
  WAITING_FOR_RETRY = 'waiting for retry',
  ALREADY_CLAIMED = 'already claimed',
  SUCCESS = 'success',
  ERROR = 'error'
}

export type Claim = {
  challengeId: ChallengeRewardID
  specifiers: Specifier[]
  amount: number
}

export enum HCaptchaStatus {
  NONE = 'none',
  SUCCESS = 'success',
  ERROR = 'error',
  USER_CLOSED = 'user_closed'
}

export enum CognitoFlowStatus {
  CLOSED = 'closed',
  OPENED = 'opened'
}

type UserChallengesPayload = {
  userChallenges: UserChallenge[] | null
}

export type UndisbursedUserChallenge = Pick<
  UserChallenge,
  'challenge_id' | 'amount' | 'specifier' | 'user_id'
> & {
  completed_blocknumber: number
  handle: string
  wallet: string
}

type RewardsUIState = {
  loading: boolean
  trendingRewardsModalType: TrendingRewardsModalType
  challengeRewardsModalType: ChallengeRewardsModalType
  userChallenges: Partial<
    Record<ChallengeRewardID, Record<Specifier, UserChallenge>>
  >
  undisbursedChallenges: UndisbursedUserChallenge[]
  userChallengesOverrides: Partial<
    Record<ChallengeRewardID, Partial<UserChallenge>>
  >
  disbursedChallenges: Partial<Record<ChallengeRewardID, Specifier[]>>
  claimStatus: ClaimStatus
  claimToRetry?: Claim
  hCaptchaStatus: HCaptchaStatus
  cognitoFlowStatus: CognitoFlowStatus
  cognitoFlowUrlStatus?: Status
  cognitoFlowUrl?: string
  showRewardClaimedToast: boolean
}

const initialState: RewardsUIState = {
  trendingRewardsModalType: 'tracks',
  challengeRewardsModalType: 'track-upload',
  userChallenges: {},
  undisbursedChallenges: [],
  userChallengesOverrides: {},
  disbursedChallenges: {},
  loading: true,
  claimStatus: ClaimStatus.NONE,
  hCaptchaStatus: HCaptchaStatus.NONE,
  cognitoFlowStatus: CognitoFlowStatus.CLOSED,
  showRewardClaimedToast: false
}

const slice = createSlice({
  name: 'rewards-page',
  initialState,
  reducers: {
    fetchUserChallenges: (state) => {},
    fetchUserChallengesSucceeded: (
      state,
      action: PayloadAction<UserChallengesPayload>
    ) => {
      const { userChallenges } = action.payload
      if (userChallenges === null) {
        state.userChallenges = {}
      } else {
        state.userChallenges = userChallenges.reduce<
          Partial<Record<ChallengeRewardID, Record<Specifier, UserChallenge>>>
        >(
          (acc, challenge) => ({
            ...acc,
            [challenge.challenge_id]: {
              ...(acc[challenge.challenge_id] || {}),
              [challenge.specifier]: challenge
            }
          }),
          {}
        )
      }
      state.loading = false
    },
    fetchUserChallengesFailed: (state) => {
      state.loading = false
    },
    setUndisbursedChallenges: (
      state,
      action: PayloadAction<UndisbursedUserChallenge[]>
    ) => {
      if (state.undisbursedChallenges.length > 0 || action.payload.length > 0) {
        state.undisbursedChallenges = action.payload
      }
    },
    setUserChallengesDisbursed: (
      state,
      action: PayloadAction<{
        challengeId: ChallengeRewardID
        specifiers: Specifier[]
      }>
    ) => {
      const { challengeId, specifiers } = action.payload

      const userChallenge = Object.values(
        state.userChallenges[challengeId] || {}
      )[0]

      if (!userChallenge) return

      // Keep track of individual challenges for rolled up aggregates
      if (userChallenge.challenge_type === 'aggregate') {
        state.disbursedChallenges[challengeId] = ([] as string[]).concat(
          state.disbursedChallenges[challengeId] ?? [],
          specifiers
        )
        // All completed challenges that are disbursed are fully disbursed
        if (userChallenge?.is_complete) {
          state.userChallengesOverrides[challengeId] = {
            ...state.userChallengesOverrides[challengeId],
            is_disbursed: true
          }
        }
      } else {
        state.userChallengesOverrides[challengeId] = {
          ...state.userChallengesOverrides[challengeId],
          is_disbursed: true
        }
      }
    },
    updateOptimisticListenStreak: (state) => {},
    setUserChallengeCurrentStepCount: (
      state,
      action: PayloadAction<{
        challengeId: ChallengeRewardID
        stepCount: number
      }>
    ) => {
      const { challengeId, stepCount } = action.payload
      state.userChallengesOverrides[challengeId] = {
        ...state.userChallengesOverrides[challengeId],
        current_step_count: stepCount
      }
    },
    resetUserChallengeCurrentStepCount: (
      state,
      action: PayloadAction<{
        challengeId: ChallengeRewardID
      }>
    ) => {
      const { challengeId } = action.payload
      const userChallengeOverride = state.userChallengesOverrides[challengeId]
      if (
        userChallengeOverride &&
        'current_step_count' in userChallengeOverride
      ) {
        delete userChallengeOverride.current_step_count
      }
    },
    setTrendingRewardsModalType: (
      state,
      action: PayloadAction<{ modalType: TrendingRewardsModalType }>
    ) => {
      const { modalType } = action.payload
      state.trendingRewardsModalType = modalType
    },
    setChallengeRewardsModalType: (
      state,
      action: PayloadAction<{ modalType: ChallengeRewardsModalType }>
    ) => {
      const { modalType } = action.payload
      state.challengeRewardsModalType = modalType
    },
    setHCaptchaStatus: (
      state,
      action: PayloadAction<{ status: HCaptchaStatus }>
    ) => {
      const { status } = action.payload
      state.hCaptchaStatus = status
    },
    resetHCaptchaStatus: (state) => {
      state.hCaptchaStatus = HCaptchaStatus.NONE
    },
    updateHCaptchaScore: (
      state,
      action: PayloadAction<{ token: string }>
    ) => {},
    resetAndCancelClaimReward: (state) => {
      state.claimStatus = ClaimStatus.NONE
    },
    claimChallengeReward: (
      state,
      _action: PayloadAction<{
        claim: Claim
        retryOnFailure: boolean
        retryCount?: number
      }>
    ) => {
      state.claimStatus = ClaimStatus.CLAIMING
    },
    claimChallengeRewardWaitForRetry: (state, action: PayloadAction<Claim>) => {
      state.claimStatus = ClaimStatus.WAITING_FOR_RETRY
      state.claimToRetry = action.payload
    },
    claimChallengeRewardFailed: (state) => {
      state.claimStatus = ClaimStatus.ERROR
    },
    claimChallengeRewardAlreadyClaimed: (state) => {
      state.claimStatus = ClaimStatus.ALREADY_CLAIMED
    },
    claimChallengeRewardSucceeded: (state) => {
      state.claimStatus = ClaimStatus.SUCCESS
    },
    setCognitoFlowStatus: (
      state,
      action: PayloadAction<{ status: CognitoFlowStatus }>
    ) => {
      const { status } = action.payload
      state.cognitoFlowStatus = status
    },
    fetchCognitoFlowUrl: (state) => {
      state.cognitoFlowUrlStatus = Status.LOADING
    },
    fetchCognitoFlowUrlSucceeded: (state, action: PayloadAction<string>) => {
      state.cognitoFlowUrlStatus = Status.SUCCESS
      state.cognitoFlowUrl = action.payload
    },
    fetchCognitoFlowUrlFailed: (state) => {
      state.cognitoFlowUrlStatus = Status.ERROR
    },
    showRewardClaimedToast: (state) => {
      state.showRewardClaimedToast = true
    },
    resetRewardClaimedToast: (state) => {
      state.showRewardClaimedToast = false
    }
  }
})

export const {
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  fetchUserChallengesFailed,
  setUndisbursedChallenges,
  setTrendingRewardsModalType,
  setChallengeRewardsModalType,
  setUserChallengesDisbursed,
  resetAndCancelClaimReward,
  setHCaptchaStatus,
  resetHCaptchaStatus,
  updateHCaptchaScore,
  claimChallengeReward,
  claimChallengeRewardWaitForRetry,
  claimChallengeRewardAlreadyClaimed,
  claimChallengeRewardFailed,
  claimChallengeRewardSucceeded,
  setCognitoFlowStatus,
  fetchCognitoFlowUrl,
  fetchCognitoFlowUrlFailed,
  fetchCognitoFlowUrlSucceeded,
  showRewardClaimedToast,
  resetRewardClaimedToast,
  updateOptimisticListenStreak,
  setUserChallengeCurrentStepCount,
  resetUserChallengeCurrentStepCount
} = slice.actions

export default slice
