import type { AppState } from 'app/store'

export const getDownloadedPercentage = (state: AppState) =>
  state.downloads.downloadedPercentage
export const getFileName = (state: AppState) => state.downloads.fileName
export const getFetchCancel = (state: AppState) => state.downloads.fetchCancel
export const getTrackName = (state: AppState) => state.downloads.trackName
export const getDownloadError = (state: AppState) => state.downloads.error
