import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppState } from 'store/types'

import { UserChallenge, ChallengeRewardID } from '../types'

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
    setCognitoFlowStatus: (
      state,
      action: PayloadAction<{ status: CognitoFlowStatus }>
    ) => {
      const { status } = action.payload
      state.cognitoFlowStatus = status
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
  resetClaimStatus,
  setHCaptchaStatus,
  resetHCaptchaStatus,
  setCognitoFlowStatus
} = slice.actions

export const getTrendingRewardsModalType = (state: AppState) =>
  state.application.pages.rewardsPage.trendingRewardsModalType

export const getChallengeRewardsModalType = (state: AppState) =>
  state.application.pages.rewardsPage.challengeRewardsModalType

export const getUserChallenges = (state: AppState) =>
  state.application.pages.rewardsPage.userChallenges

export const getUserChallenge = (
  state: AppState,
  challengeId: ChallengeRewardID
) => state.application.pages.rewardsPage.userChallenges[challengeId]

export const getUserChallengesLoading = (state: AppState) =>
  state.application.pages.rewardsPage.loading

export const getClaimStatus = (state: AppState) =>
  state.application.pages.rewardsPage.claimStatus

export const getHCaptchaStatus = (state: AppState) =>
  state.application.pages.rewardsPage.hCaptchaStatus

export const getCognitoFlowStatus = (state: AppState) =>
  state.application.pages.rewardsPage.cognitoFlowStatus

export default slice.reducer
