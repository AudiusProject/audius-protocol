import type { AppState } from 'app/store'

import type { OfflineDownloadsState } from './slice'

export const getOfflineDownloadStatus = (state: AppState) =>
  state.offlineDownloads.downloadStatus

export const getTrackOfflineDownloadStatus =
  (trackId?: string) => (state: AppState) =>
    trackId ? state.offlineDownloads.downloadStatus[trackId] : null

export const getIsCollectionMarkedForDownload =
  (collection?: string) => (state: AppState) =>
    !!(collection && state.offlineDownloads.collections[collection])

export const getOfflineTracks = (
  state: AppState
): OfflineDownloadsState['tracks'] => state.offlineDownloads.tracks

export const getOfflineCollections = (
  state: AppState
): OfflineDownloadsState['collections'] => state.offlineDownloads.collections
