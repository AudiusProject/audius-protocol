import type { AppState } from 'app/store'

export const getOfflineDownloadStatus = (state: AppState) =>
  state.offlineDownloads.downloadStatus

export const getItemOfflineDownloadStatus =
  (id?: string) => (state: AppState) =>
    id ? state.offlineDownloads.downloadStatus[id] : null

export const getOfflineTracks = (state: AppState) =>
  state.offlineDownloads.tracks
