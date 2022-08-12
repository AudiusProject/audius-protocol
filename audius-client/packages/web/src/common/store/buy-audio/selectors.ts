import { AppState } from 'store/types'

export const getBuyAudioFlowStage = (state: AppState) => state.ui.buyAudio.stage

export const getAudioPurchaseInfo = (state: AppState) =>
  state.ui.buyAudio.purchaseInfo

export const getFeesCache = (state: AppState) => state.ui.buyAudio.feesCache
