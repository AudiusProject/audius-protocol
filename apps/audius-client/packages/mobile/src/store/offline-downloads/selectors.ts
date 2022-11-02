import type { AppState } from 'app/store'

export const getOfflineDownloadStatus = (state: AppState) =>
  state.offlineDownloads.downloadStatus

export const getTrackOfflineDownloadStatus =
  (trackId: string) => (state: AppState) =>
    state.offlineDownloads.downloadStatus[trackId]

export const getOfflineTracks = (state: AppState) =>
  state.offlineDownloads.tracks
