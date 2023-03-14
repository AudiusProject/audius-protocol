import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID } from 'models/Identifiers'

import { PlaybackPositionInfo, PlaybackPositionState } from './types'

type InitializePlaybackPositionStatePayload = {
  playbackPositionState: PlaybackPositionState
}

type SetTrackPositionPayload = {
  trackId: ID
  positionInfo: PlaybackPositionInfo
}

type ClearTrackPositionPayload = {
  trackId: ID
}

const initialState: PlaybackPositionState = {
  trackPositions: {}
}

const slice = createSlice({
  name: 'playback-position',
  initialState,
  reducers: {
    // NOTE: This should only be called when seeding the initial state from local storage
    initializePlaybackPositionState: (
      state,
      action: PayloadAction<InitializePlaybackPositionStatePayload>
    ) => {
      const { playbackPositionState } = action.payload
      state.trackPositions =
        playbackPositionState.trackPositions ?? state.trackPositions
    },
    setTrackPosition: (
      state,
      action: PayloadAction<SetTrackPositionPayload>
    ) => {
      const { trackId, positionInfo } = action.payload
      state.trackPositions[trackId] = positionInfo
    },
    clearTrackPosition: (
      state,
      action: PayloadAction<ClearTrackPositionPayload>
    ) => {
      const { trackId } = action.payload
      delete state.trackPositions[trackId]
    }
  }
})

export const {
  initializePlaybackPositionState,
  setTrackPosition,
  clearTrackPosition
} = slice.actions

export const actions = slice.actions
export default slice.reducer
