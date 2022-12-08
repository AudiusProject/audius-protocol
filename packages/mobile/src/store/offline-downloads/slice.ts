import type { Track } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type OfflineDownloadsState = typeof initialState

type State = {
  downloadStatus: {
    [key: string]: OfflineTrackDownloadStatus
  }
  tracks: {
    [key: string]: Track
  }
  collections: {
    [key: string]: boolean
  }
}

export enum OfflineTrackDownloadStatus {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

const initialState: State = {
  downloadStatus: {},
  tracks: {},
  collections: {}
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
    loadTracks: (state, { payload: tracks }: PayloadAction<Track[]>) => {
      tracks.forEach((track) => {
        const trackIdStr = track.track_id.toString()
        state.tracks[trackIdStr] = track
        state.downloadStatus[trackIdStr] = OfflineTrackDownloadStatus.SUCCESS
      })
    },
    loadTrack: (state, { payload: track }: PayloadAction<Track>) => {
      const trackIdStr = track.track_id.toString()
      state.tracks[trackIdStr] = track
      state.downloadStatus[trackIdStr] = OfflineTrackDownloadStatus.SUCCESS
    },
    unloadTrack: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.tracks[trackId]
      delete state.downloadStatus[trackId]
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
  unloadTrack
} = slice.actions

export default slice.reducer
