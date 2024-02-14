import { CommonState } from '../commonStore'

export const getDownloadedPercentage = (state: CommonState) =>
  state.downloads.downloadedPercentage
export const getFileName = (state: CommonState) => state.downloads.fileName
export const getFetchCancel = (state: CommonState) =>
  state.downloads.fetchCancel
export const getTrackName = (state: CommonState) => state.downloads.trackName
export const getDownloadError = (state: CommonState) => state.downloads.error
