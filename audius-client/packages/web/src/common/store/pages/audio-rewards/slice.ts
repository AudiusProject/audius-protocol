import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Status from 'common/models/Status'

import { UserChallenge, ChallengeRewardID } from '../../../models/AudioRewards'

export type TrendingRewardsModalType = 'tracks' | 'playlists' | 'underground'
export type ChallengeRewardsModalType = ChallengeRewardID

export enum ClaimStatus {
  NONE = 'none',
  CLAIMING = 'claiming',
  SUCCESS = 'success',
  ERROR = 'error'
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
  claimStatus: ClaimStatus
  hCaptchaStatus: HCaptchaStatus
  cognitoFlowStatus: CognitoFlowStatus
  cognitoFlowUrlStatus?: Status
  cognitoFlowUrl?: string
}

const initialState: RewardsUIState = {
  trendingRewardsModalType: 'tracks',
  challengeRewardsModalType: 'track-upload',
  userChallenges: {},
  loading: true,
  claimStatus: ClaimStatus.NONE,
  hCaptchaStatus: HCaptchaStatus.NONE,
  cognitoFlowStatus: CognitoFlowStatus.CLOSED
}

const slice = createSlice({
  name: 'rewards-page',
  initialState,
  reducers: {
    fetchUserChallenges: state => {
      state.userChallenges = {}
      state.loading = true
    },
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
      const challenge = state.userChallenges[challengeId]
      if (challenge !== undefined) {
        challenge.is_disbursed = true
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
    setClaimStatus: (state, action: PayloadAction<{ status: ClaimStatus }>) => {
      const { status } = action.payload
      state.claimStatus = status
    },
    resetClaimStatus: state => {
      state.claimStatus = ClaimStatus.NONE
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
    }
  }
})

export const {
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  fetchUserChallengesFailed,
  setTrendingRewardsModalType,
  setChallengeRewardsModalType,
  setClaimStatus,
  setUserChallengeDisbursed,
  resetClaimStatus,
  setHCaptchaStatus,
  resetHCaptchaStatus,
  updateHCaptchaScore,
  setCognitoFlowStatus,
  fetchCognitoFlowUrl,
  fetchCognitoFlowUrlFailed,
  fetchCognitoFlowUrlSucceeded
} = slice.actions

export default slice
