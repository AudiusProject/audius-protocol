import { CommonState } from '../commonStore'

export const getPremiumTrackSignatureMap = (state: CommonState) =>
  state.premiumContent.premiumTrackSignatureMap

export const getPremiumTrackStatus = (state: CommonState) =>
  state.premiumContent.status
