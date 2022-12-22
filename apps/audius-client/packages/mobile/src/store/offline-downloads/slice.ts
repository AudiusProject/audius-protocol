import type { Track, UserTrackMetadata } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

type LineupTrack = Track & UserTrackMetadata & { uid: string }

export type OfflineDownloadsState = {
  downloadStatus: {
    [key: string]: OfflineTrackDownloadStatus
  }
  tracks: {
    [key: string]: LineupTrack
  }
  collections: {
    [key: string]: boolean
  }
  isDoneLoadingFromDisk: boolean
}

export enum OfflineTrackDownloadStatus {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

const initialState: OfflineDownloadsState = {
  downloadStatus: {},
  tracks: {},
  collections: {},
  isDoneLoadingFromDisk: false
}

const slice = createSlice({
  name: 'offlineDownloads',
  initialState,
  reducers: {
    startDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineTrackDownloadStatus.LOADING
    },
    batchStartDownload: (
      state,
      { payload: trackIds }: PayloadAction<string[]>
    ) => {
      trackIds.forEach((trackId) => {
        state.downloadStatus[trackId] = OfflineTrackDownloadStatus.LOADING
      })
    },
    completeDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineTrackDownloadStatus.SUCCESS
    },
    errorDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = OfflineTrackDownloadStatus.ERROR
    },
    removeDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.downloadStatus[trackId]
    },
    addCollection: (
      state,
      { payload: collectionId }: PayloadAction<string>
    ) => {
      state.collections[collectionId] = true
    },
    removeCollection: (
      state,
      { payload: collectionId }: PayloadAction<string>
    ) => {
      state.collections[collectionId] = false
    },
    loadTracks: (state, { payload: tracks }: PayloadAction<LineupTrack[]>) => {
      tracks.forEach((track) => {
        const trackIdStr = track.track_id.toString()
        state.tracks[trackIdStr] = track
        state.downloadStatus[trackIdStr] = OfflineTrackDownloadStatus.SUCCESS
      })
    },
    loadTrack: (state, { payload: track }: PayloadAction<LineupTrack>) => {
      const trackIdStr = track.track_id.toString()
      state.tracks[trackIdStr] = track
      state.downloadStatus[trackIdStr] = OfflineTrackDownloadStatus.SUCCESS
    },
    unloadTrack: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.tracks[trackId]
      delete state.downloadStatus[trackId]
    },
    unloadTracks: (state, { payload: trackIds }: PayloadAction<string[]>) => {
      trackIds.forEach((trackId) => {
        delete state.tracks[trackId]
        delete state.downloadStatus[trackId]
      })
    },
    doneLoadingFromDisk: (state) => {
      state.isDoneLoadingFromDisk = true
    },
    clearOfflineDownloads: (state) => {
      state.collections = initialState.collections
      state.tracks = initialState.tracks
      state.downloadStatus = initialState.downloadStatus
      state.isDoneLoadingFromDisk = initialState.isDoneLoadingFromDisk
    }
  }
})

export const {
  startDownload,
  batchStartDownload,
  completeDownload,
  errorDownload,
  removeDownload,
  addCollection,
  removeCollection,
  loadTracks,
  loadTrack,
  unloadTrack,
  unloadTracks,
  doneLoadingFromDisk,
  clearOfflineDownloads
} = slice.actions

export default slice.reducer
