import type { Track } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type OfflineDownloadsState = typeof initialState

type State = {
  downloadStatus: {
    [key: string]: OfflineItemDownloadStatus
  }
  tracks: {
    [key: string]: Track
  }
}

export enum OfflineItemDownloadStatus {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

const initialState: State = {
  downloadStatus: {},
  tracks: {}
}

const slice = createSlice({
  name: 'offlineDownloads',
  initialState,
  reducers: {
    startDownload: (state, { payload: id }: PayloadAction<string>) => {
      state.downloadStatus[id] = OfflineItemDownloadStatus.LOADING
    },
    completeDownload: (state, { payload: id }: PayloadAction<string>) => {
      state.downloadStatus[id] = OfflineItemDownloadStatus.SUCCESS
    },
    errorDownload: (state, { payload: id }: PayloadAction<string>) => {
      state.downloadStatus[id] = OfflineItemDownloadStatus.ERROR
    },
    removeDownload: (state, { payload: id }: PayloadAction<string>) => {
      delete state.downloadStatus[id]
    },
    loadTracks: (state, { payload: tracks }: PayloadAction<Track[]>) => {
      tracks.forEach((track) => {
        const trackIdStr = track.track_id.toString()
        state.tracks[trackIdStr] = track
        state.downloadStatus[trackIdStr] = OfflineItemDownloadStatus.SUCCESS
      })
    },
    loadTrack: (state, { payload: track }: PayloadAction<Track>) => {
      const trackIdStr = track.track_id.toString()
      state.tracks[trackIdStr] = track
      state.downloadStatus[trackIdStr] = OfflineItemDownloadStatus.SUCCESS
    },
    unloadTrack: (state, { payload: trackId }: PayloadAction<string>) => {
      delete state.tracks[trackId]
      delete state.downloadStatus[trackId]
    }
  }
})

export const {
  startDownload,
  completeDownload,
  errorDownload,
  removeDownload,
  loadTracks,
  loadTrack,
  unloadTrack
} = slice.actions

export default slice.reducer
