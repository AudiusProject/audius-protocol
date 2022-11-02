import type { Track } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type OfflineDownloadsState = typeof initialState

type State = {
  downloadStatus: {
    [key: string]: TrackDownloadStatus
  }
  tracks: {
    [key: string]: Track
  }
}

export enum TrackDownloadStatus {
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
    startDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = TrackDownloadStatus.LOADING
    },
    completeDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = TrackDownloadStatus.SUCCESS
    },
    errorDownload: (state, { payload: trackId }: PayloadAction<string>) => {
      state.downloadStatus[trackId] = TrackDownloadStatus.ERROR
    },
    loadTracks: (state, { payload: tracks }: PayloadAction<Track[]>) => {
      tracks.forEach((track) => {
        const trackIdStr = track.track_id.toString()
        state.tracks[trackIdStr] = track
        state.downloadStatus[trackIdStr] = TrackDownloadStatus.SUCCESS
      })
    },
    loadTrack: (state, { payload: track }: PayloadAction<Track>) => {
      const trackIdStr = track.track_id.toString()
      state.tracks[trackIdStr] = track
      state.downloadStatus[trackIdStr] = TrackDownloadStatus.SUCCESS
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
  loadTracks,
  loadTrack,
  unloadTrack
} = slice.actions

export default slice.reducer
