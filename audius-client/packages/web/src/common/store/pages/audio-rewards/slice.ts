import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Status from 'common/models/Status'

import { UserChallenge, ChallengeRewardID } from '../../../models/AudioRewards'

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
  specifier: string
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

type RewardsUIState = {
  loading: boolean
  trendingRewardsModalType: TrendingRewardsModalType
  challengeRewardsModalType: ChallengeRewardsModalType
  userChallenges: Partial<Record<ChallengeRewardID, UserChallenge>>
  userChallengesOverrides: Partial<
    Record<ChallengeRewardID, Partial<UserChallenge>>
  >
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
  userChallengesOverrides: {},
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
    fetchUserChallenges: state => {},
    fetchUserChallengesSucceeded: (
      state,
      action: PayloadAction<UserChallengesPayload>
    ) => {
      const { userChallenges } = action.payload
      if (userChallenges === null) {
        state.userChallenges = {}
      } else {
        state.userChallenges = userChallenges.reduce((acc, challenge) => {
          acc[challenge.challenge_id] = challenge
          return acc
        }, {} as Partial<Record<ChallengeRewardID, UserChallenge>>)
      }
      state.loading = false
    },
    fetchUserChallengesFailed: state => {
      state.loading = false
    },
    setUserChallengeDisbursed: (
      state,
      action: PayloadAction<{ challengeId: ChallengeRewardID }>
    ) => {
      const { challengeId } = action.payload
      state.userChallengesOverrides[challengeId] = {
        ...state.userChallengesOverrides[challengeId],
        is_disbursed: true
      }
    },
    updateOptimisticListenStreak: state => {},
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
    resetHCaptchaStatus: state => {
      state.hCaptchaStatus = HCaptchaStatus.NONE
    },
    updateHCaptchaScore: (
      state,
      action: PayloadAction<{ token: string }>
    ) => {},
    resetAndCancelClaimReward: state => {
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
    claimChallengeRewardFailed: state => {
      state.claimStatus = ClaimStatus.ERROR
    },
    claimChallengeRewardAlreadyClaimed: state => {
      state.claimStatus = ClaimStatus.ALREADY_CLAIMED
    },
    claimChallengeRewardSucceeded: state => {
      state.claimStatus = ClaimStatus.SUCCESS
    },
    setCognitoFlowStatus: (
      state,
      action: PayloadAction<{ status: CognitoFlowStatus }>
    ) => {
      const { status } = action.payload
      state.cognitoFlowStatus = status
    },
    fetchCognitoFlowUrl: state => {
      state.cognitoFlowUrlStatus = Status.LOADING
    },
    fetchCognitoFlowUrlSucceeded: (state, action: PayloadAction<string>) => {
      state.cognitoFlowUrlStatus = Status.SUCCESS
      state.cognitoFlowUrl = action.payload
    },
    fetchCognitoFlowUrlFailed: state => {
      state.cognitoFlowUrlStatus = Status.ERROR
    },
    showRewardClaimedToast: state => {
      state.showRewardClaimedToast = true
    },
    resetRewardClaimedToast: state => {
      state.showRewardClaimedToast = false
    }
  }
})

export const {
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  fetchUserChallengesFailed,
  setTrendingRewardsModalType,
  setChallengeRewardsModalType,
  setUserChallengeDisbursed,
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
