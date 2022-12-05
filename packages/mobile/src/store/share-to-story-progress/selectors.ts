import type { AppState } from 'app/store'

export const getProgressPercentage = (state: AppState) =>
  state.shareToStoryProgress.progress
export const getCancel = (state: AppState) => state.shareToStoryProgress.cancel
