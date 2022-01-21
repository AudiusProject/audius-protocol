import { ChallengeRewardID } from 'common/models/AudioRewards'
import { CommonState } from 'common/store'

export const getTrendingRewardsModalType = (state: CommonState) =>
  state.pages.audioRewards.trendingRewardsModalType

export const getChallengeRewardsModalType = (state: CommonState) =>
  state.pages.audioRewards.challengeRewardsModalType

export const getUserChallenges = (state: CommonState) =>
  state.pages.audioRewards.userChallenges

export const getUserChallenge = (
  state: CommonState,
  props: { challengeId: ChallengeRewardID }
) => state.pages.audioRewards.userChallenges[props.challengeId]

export const getUserChallengesOverrides = (state: CommonState) =>
  state.pages.audioRewards.userChallengesOverrides

export const getUserChallengesLoading = (state: CommonState) =>
  state.pages.audioRewards.loading

export const getClaimStatus = (state: CommonState) =>
  state.pages.audioRewards.claimStatus

export const getClaimToRetry = (state: CommonState) =>
  state.pages.audioRewards.claimToRetry

export const getHCaptchaStatus = (state: CommonState) =>
  state.pages.audioRewards.hCaptchaStatus

export const getCognitoFlowStatus = (state: CommonState) =>
  state.pages.audioRewards.cognitoFlowStatus

export const getCognitoFlowUrl = (state: CommonState) =>
  state.pages.audioRewards.cognitoFlowUrl

export const getCognitoFlowUrlStatus = (state: CommonState) =>
  state.pages.audioRewards.cognitoFlowUrlStatus
