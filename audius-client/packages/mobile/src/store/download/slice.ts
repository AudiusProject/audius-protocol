import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'

export type DownloadState = typeof initialState

type State = {
  downloadedPercentage: number
  fetchCancel: Nullable<() => void>
  trackName: Nullable<string>
  fileName: Nullable<string>
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
    setDownloadedPercentage: (state, action: PayloadAction<number>) => {
      state.downloadedPercentage = action.payload
    },
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
    setFetchCancel: (state, action: PayloadAction<() => void>) => {
      state.fetchCancel = action.payload
    }
  }
})

export const { setDownloadedPercentage, setFileInfo, setFetchCancel } =
  slice.actions

export default slice.reducer
