import { createSelector } from 'reselect'

import type { AppState } from 'app/store'

import type { OfflineDownloadsState } from './slice'
import { OfflineTrackDownloadStatus } from './slice'

export const getOfflineDownloadStatus = (state: AppState) =>
  state.offlineDownloads.downloadStatus

export const getTrackOfflineDownloadStatus =
  (trackId?: number) => (state: AppState) =>
    trackId ? state.offlineDownloads.downloadStatus[trackId] : null

export const getIsCollectionMarkedForDownload =
  (collection?: string) => (state: AppState) =>
    !!(
      collection &&
      (state.offlineDownloads.collections[collection] ||
        state.offlineDownloads.favoritedCollections[collection])
    )

export const getOfflineTracks = (
  state: AppState
): OfflineDownloadsState['tracks'] => state.offlineDownloads.tracks

export const getOfflineCollections = (
  state: AppState
): OfflineDownloadsState['collections'] => state.offlineDownloads.collections

export const getOfflineFavoritedCollections = (
  state: AppState
): OfflineDownloadsState['favoritedCollections'] =>
  state.offlineDownloads.favoritedCollections

export const getIsDoneLoadingFromDisk = (state: AppState): boolean =>
  state.offlineDownloads.isDoneLoadingFromDisk

export const getIsAnyDownloadInProgress = createSelector(
  [getOfflineDownloadStatus, (state, trackIds) => trackIds],
  (offlineDownloadStatus, trackIds) => {
    return trackIds.some((trackId: number) => {
      const status = offlineDownloadStatus[trackId.toString()]
      return status === OfflineTrackDownloadStatus.LOADING
    })
  }
)

export const getIsAllDownloadsErrored = createSelector(
  [getOfflineDownloadStatus, (state, trackIds) => trackIds],
  (offlineDownloadStatus, trackIds) => {
    return (
      trackIds.length > 0 &&
      trackIds.every((trackId: number) => {
        const status = offlineDownloadStatus[trackId.toString()]
        return status === OfflineTrackDownloadStatus.ERROR
      })
    )
  }
)
