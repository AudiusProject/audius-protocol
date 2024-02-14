import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { Nullable } from '~/utils'

export type DownloadState = typeof initialState

type State = {
  downloadedPercentage: number
  fetchCancel: Nullable<() => void>
  trackName: Nullable<string>
  fileName: Nullable<string>
  error?: Error
}

const initialState: State = {
  downloadedPercentage: 0,
  fetchCancel: null,
  trackName: null,
  fileName: null
}

const slice = createSlice({
  name: 'downloadTrack',
  initialState,
  reducers: {
    beginDownload: (state) => {
      state.error = undefined
    },
    setDownloadError: (state, action: PayloadAction<Error>) => {
      state.error = action.payload
    },
    // Mobile only
    setDownloadedPercentage: (state, action: PayloadAction<number>) => {
      state.downloadedPercentage = action.payload
    },
    // Mobile only
    setFileInfo: (
      state,
      action: PayloadAction<{
        trackName: string
        fileName: string
      }>
    ) => {
      state.trackName = action.payload.trackName
      state.fileName = action.payload.fileName
    },
    // Mobile only
    setFetchCancel: (state, action: PayloadAction<() => void>) => {
      state.fetchCancel = action.payload
    }
  }
})

export const {
  beginDownload,
  setDownloadedPercentage,
  setFileInfo,
  setFetchCancel,
  setDownloadError
} = slice.actions
export const actions = slice.actions

export default slice.reducer
