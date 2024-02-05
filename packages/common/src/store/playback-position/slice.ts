import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID } from '~/models/Identifiers'

import { PlaybackPositionInfo, PlaybackPositionState } from './types'

type InitializePlaybackPositionStatePayload = {
  playbackPositionState: PlaybackPositionState
}

type SetTrackPositionPayload = {
  trackId: ID
  userId?: ID | null
  positionInfo: PlaybackPositionInfo
}

type ClearTrackPositionPayload = {
  trackId: ID
  userId?: ID | null
}

const initialState: PlaybackPositionState = {}

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
      const userIds = Object.keys(playbackPositionState)
      userIds.forEach((userId) => {
        state[userId] = playbackPositionState[userId]
      })
    },
    setTrackPosition: (
      state,
      action: PayloadAction<SetTrackPositionPayload>
    ) => {
      const { userId, trackId, positionInfo } = action.payload
      if (!userId) return

      const userState = state[userId] ?? { trackPositions: {} }
      userState.trackPositions[trackId] = positionInfo
      state[userId] = userState
    },
    clearTrackPosition: (
      state,
      action: PayloadAction<ClearTrackPositionPayload>
    ) => {
      const { userId, trackId } = action.payload
      if (!userId) return
      delete state[userId]?.trackPositions[trackId]
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
