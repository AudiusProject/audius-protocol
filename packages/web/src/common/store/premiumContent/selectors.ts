import { AppState } from 'store/types'

export const getPremiumTrackSignatureMap = (state: AppState) =>
  state.premiumContent.premiumTrackSignatureMap
