import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AppState } from 'store/types'
import { Nullable } from 'utils/typeUtils'

export type AudioManagerState = {
  state: Nullable<string>
}

const initialState: AudioManagerState = {
  state: null
}

const slice = createSlice({
  name: 'audio-manager',
  initialState,
  reducers: {
    setState: (
      state,
      {
        payload: { state: audioManagerState }
      }: PayloadAction<{ state: string }>
    ) => {
      state.state = audioManagerState
    },
    confirmTransferAudioToWAudio: state => {}
  }
})

// Selectors
export const getAudioManagerState = (state: AppState): Nullable<string> => {
  const audioManagerState = state.audioManager.state
  return audioManagerState
}

export const { setState, confirmTransferAudioToWAudio } = slice.actions

export default slice.reducer
