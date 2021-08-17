import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppState } from 'store/types'

import { UserChallenge, ChallengeRewardID } from '../types'

export type TrendingRewardsModalType = 'tracks' | 'playlists' | 'underground'
export type ChallengeRewardsModalType = ChallengeRewardID

type UserChallengesPayload = {
  userChallenges: UserChallenge[] | null
}

type RewardsUIState = {
  loading: boolean
  trendingRewardsModalType: TrendingRewardsModalType
  challengeRewardsModalType: ChallengeRewardsModalType
  userChallenges: Partial<Record<ChallengeRewardID, UserChallenge>>
}

const initialState: RewardsUIState = {
  trendingRewardsModalType: 'tracks',
  challengeRewardsModalType: 'track-upload',
  userChallenges: {},
  loading: true
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
    }
  }
})

export const {
  fetchUserChallenges,
  fetchUserChallengesSucceeded,
  fetchUserChallengesFailed,
  setTrendingRewardsModalType,
  setChallengeRewardsModalType
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

export default slice.reducer
