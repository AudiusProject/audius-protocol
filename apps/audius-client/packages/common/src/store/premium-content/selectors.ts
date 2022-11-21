import { CommonState } from '../commonStore'

export const getPremiumTrackSignatureMap = (state: CommonState) =>
  state.premiumContent.premiumTrackSignatureMap
