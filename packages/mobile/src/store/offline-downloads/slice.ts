import type {
  DownloadReason,
  ID,
  Track,
  UserTrackMetadata
} from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type CollectionId = ID | string

type CollectionStatusPayload = {
  collectionId: CollectionId
  isFavoritesDownload?: boolean
}

type LineupTrack = Track & UserTrackMetadata

export type OfflineDownloadsState = {
  downloadStatus: {
    [key: string]: OfflineDownloadStatus
  }
  collectionStatus: {
    [key: string]: OfflineDownloadStatus
  }
  favoritedCollectionStatus: {
    [key: string]: OfflineDownloadStatus
  }
  tracks: {
    [key: string]: LineupTrack
  }
  isDoneLoadingFromDisk: boolean
}

export type RemoveCollectionDownloadsAction = PayloadAction<{
  collectionIds: CollectionId[]
}>

export type CollectionReasonsToUpdate = {
  collectionId: CollectionId
  isFavoritesDownload: boolean
}

export type UpdateCollectionDownloadReasonsAction = PayloadAction<{
  reasons: CollectionReasonsToUpdate[]
}>

export type RemoveTrackDownloadsAction = PayloadAction<{
  trackIds: ID[]
}>

export type TrackReasonsToUpdate = {
  trackId: ID
  reasons_for_download: DownloadReason[]
}

export type UpdateTrackDownloadReasonsAction = PayloadAction<{
  reasons: TrackReasonsToUpdate[]
}>

export enum OfflineDownloadStatus {
  INACTIVE = 'INACTIVE', // download is not initiated,
  INIT = 'INIT', // download is queued
  LOADING = 'LOADING', // download is in progress
  SUCCESS = 'SUCCESS', // download succeeded
  ERROR = 'ERROR' // download errored
}

const initialState: OfflineDownloadsState = {
  downloadStatus: {},
  tracks: {},
  collectionStatus: {},
  favoritedCollectionStatus: {},
  isDoneLoadingFromDisk: false
}

const slice = createSlice({
  name: 'offlineDownloads',
  initialState,
  reducers: {
    // Queueing downloads
    batchInitDownload: (
      state,
      { payload: trackIds }: PayloadAction<string[]>
    ) => {
      trackIds.forEach((trackId) => {
        state.downloadStatus[trackId] = OfflineDownloadStatus.INIT
      })
    },
    // Actually starting the download
    startDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineDownloadStatus.LOADING
    },
    completeDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineDownloadStatus.SUCCESS
    },
    errorDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineDownloadStatus.ERROR
    },
    removeDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.downloadStatus[trackId]
    },
    batchInitCollectionDownload: (
      state,
      {
        payload: { collectionIds, isFavoritesDownload }
      }: PayloadAction<{
        collectionIds: CollectionId[]
        isFavoritesDownload: boolean
      }>
    ) => {
      collectionIds.forEach((collectionId) => {
        state.collectionStatus[collectionId] = OfflineDownloadStatus.INIT
      })
    },
    startCollectionDownload: (
      state,
      action: PayloadAction<CollectionStatusPayload>
    ) => {
      const { collectionId, isFavoritesDownload } = action.payload
      const collectionStatus = isFavoritesDownload
        ? state.favoritedCollectionStatus
        : state.collectionStatus
      collectionStatus[collectionId] = OfflineDownloadStatus.LOADING
    },
    completeCollectionDownload: (
      state,
      action: PayloadAction<CollectionStatusPayload>
    ) => {
      const { collectionId, isFavoritesDownload } = action.payload
      const collectionStatus = isFavoritesDownload
        ? state.favoritedCollectionStatus
        : state.collectionStatus
      collectionStatus[collectionId] = OfflineDownloadStatus.SUCCESS
    },
    errorCollectionDownload: (
      state,
      action: PayloadAction<CollectionStatusPayload>
    ) => {
      const { collectionId, isFavoritesDownload } = action.payload
      const collectionStatus = isFavoritesDownload
        ? state.favoritedCollectionStatus
        : state.collectionStatus
      collectionStatus[collectionId] = OfflineDownloadStatus.ERROR
    },
    removeCollectionDownload: (
      state,
      action: PayloadAction<CollectionStatusPayload>
    ) => {
      const { collectionId, isFavoritesDownload } = action.payload
      const collectionStatus = isFavoritesDownload
        ? state.favoritedCollectionStatus
        : state.collectionStatus
      delete collectionStatus[collectionId]
    },
    updateCollectionDownloadReasons: (
      state,
      action: UpdateCollectionDownloadReasonsAction
    ) => {
      const { reasons } = action.payload
      reasons.forEach((reason) => {
        const { collectionId, isFavoritesDownload } = reason
        if (isFavoritesDownload) {
          delete state.collectionStatus[collectionId]
        } else {
          delete state.favoritedCollectionStatus[collectionId]
        }
      })
    },
    removeCollectionDownloads: (
      state,
      action: RemoveCollectionDownloadsAction
    ) => {
      const { collectionIds } = action.payload
      collectionIds.forEach((collectionId) => {
        delete state.favoritedCollectionStatus[collectionId]
        delete state.collectionStatus[collectionId]
      })
    },
    loadTracks: (state, { payload: tracks }: PayloadAction<LineupTrack[]>) => {
      tracks.forEach((track) => {
        const trackIdStr = track.track_id.toString()
        state.tracks[trackIdStr] = track
        state.downloadStatus[trackIdStr] = OfflineDownloadStatus.SUCCESS
      })
    },
    loadTrack: (state, { payload: track }: PayloadAction<LineupTrack>) => {
      const trackIdStr = track.track_id.toString()
      state.tracks[trackIdStr] = track
      state.downloadStatus[trackIdStr] = OfflineDownloadStatus.SUCCESS
    },
    unloadTrack: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.tracks[trackId]
      delete state.downloadStatus[trackId]
    },
    updateTrackDownloadReasons: (
      state,
      action: UpdateTrackDownloadReasonsAction
    ) => {
      const { reasons } = action.payload
      const { tracks } = state

      reasons.forEach((reason) => {
        const { trackId, reasons_for_download } = reason
        const track = tracks[trackId]
        const { offline } = track

        if (offline) {
          offline.reasons_for_download = reasons_for_download
        }
      })
    },
    removeTrackDownloads: (state, action: RemoveTrackDownloadsAction) => {
      const { trackIds } = action.payload
      trackIds.forEach((trackId) => {
        delete state.tracks[trackId]
        delete state.downloadStatus[trackId]
      })
    },
    doneLoadingFromDisk: (state) => {
      state.isDoneLoadingFromDisk = true
    },
    clearOfflineDownloads: (state) => {
      state.collectionStatus = initialState.collectionStatus
      state.tracks = initialState.tracks
      state.downloadStatus = initialState.downloadStatus
      state.isDoneLoadingFromDisk = initialState.isDoneLoadingFromDisk
    },
    // Lifecycle actions that trigger complex saga flows
    removeAllDownloadedFavorites: () => {}
  }
})

export const {
  // TODO: don't name these the same thing
  batchInitDownload,
  startDownload,
  completeDownload,
  errorDownload,
  removeDownload,
  batchInitCollectionDownload,
  startCollectionDownload,
  completeCollectionDownload,
  errorCollectionDownload,
  updateCollectionDownloadReasons,
  removeCollectionDownload,
  removeCollectionDownloads,
  loadTracks,
  loadTrack,
  unloadTrack,
  updateTrackDownloadReasons,
  removeTrackDownloads,
  doneLoadingFromDisk,
  clearOfflineDownloads,
  removeAllDownloadedFavorites
} = slice.actions
export const actions = slice.actions

export default slice.reducer
