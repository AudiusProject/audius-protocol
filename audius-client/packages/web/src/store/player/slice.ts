import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import NativeMobileAudio from 'audio/NativeMobileAudio'
import { UID, ID } from 'common/models/Identifiers'

import { AudioState } from './types'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

type State = {
  // Identifiers for the audio that's playing.
  uid: UID | null
  trackId: ID | null

  audio: AudioState

  // Keep 'playing' in the store separately from the audio
  // object to allow components to subscribe to changes.
  playing: boolean

  // Keep 'buffering' in the store separately from the audio
  // object to allow components to subscribe to changes.
  buffering: boolean

  // Unique integer that increments every time something is "played."
  // E.g. replaying a track doesn't change uid or trackId, but counter changes.
  counter: number
}

export const initialState: State = {
  uid: null,
  trackId: null,

  // In the case of native mobile, use the native mobile audio
  // player directly. Otherwise, it is set dynamically
  audio: NATIVE_MOBILE ? new NativeMobileAudio() : null,

  playing: false,
  buffering: false,
  counter: 0
}

type SetAudioStreamPayload = {
  audio: AudioState
}

type PlayPayload = {
  uid?: UID
  trackId?: ID
  onEnd?: (...args: any) => any
}

type PlaySucceededPayload = {
  uid?: UID
  trackId?: ID
}

type PausePayload = {
  // Optionally allow only setting state which doesn't actually
  // invoke a .pause on the internal audio object. This is used in
  // native mobile audio only.
  onlySetState?: boolean
}

type StopPayload = {}

type SetBufferingPayload = {
  buffering: boolean
}

type SetPayload = {
  uid: UID
  trackId: ID
}

type SeekPayload = {
  seconds: number
}

type ErrorPayload = {
  error: string
  trackId: ID
  info: string
}

type ResetPayload = {
  shouldAutoplay: boolean
}

type ResetSucceededPayload = {
  shouldAutoplay: boolean
}

const slice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setAudioStream: (state, action: PayloadAction<SetAudioStreamPayload>) => {
      const { audio } = action.payload
      // Redux toolkit seems to do something to state.audio's type (some destructured form?)
      state.audio = audio as typeof state.audio
    },
    play: (state, action: PayloadAction<PlayPayload>) => {},
    playSucceeded: (state, action: PayloadAction<PlaySucceededPayload>) => {
      const { uid, trackId } = action.payload
      state.playing = true
      state.uid = uid || state.uid
      state.trackId = trackId || state.trackId
    },
    pause: (state, action: PayloadAction<PausePayload>) => {
      state.playing = false
    },
    setBuffering: (state, action: PayloadAction<SetBufferingPayload>) => {
      const { buffering } = action.payload
      state.buffering = buffering
    },
    stop: (state, action: PayloadAction<StopPayload>) => {
      state.playing = false
      state.uid = null
      state.trackId = null
      state.counter = state.counter + 1
    },
    set: (state, action: PayloadAction<SetPayload>) => {
      const { uid, trackId } = action.payload
      state.uid = uid
      state.trackId = trackId
    },
    reset: (state, action: PayloadAction<ResetPayload>) => {},
    resetSuceeded: (state, action: PayloadAction<ResetSucceededPayload>) => {
      const { shouldAutoplay } = action.payload
      state.playing = shouldAutoplay
      state.counter = state.counter + 1
    },
    seek: (state, actions: PayloadAction<SeekPayload>) => {},
    error: (state, actions: PayloadAction<ErrorPayload>) => {},
    incrementCount: state => {
      state.counter = state.counter + 1
    }
  }
})

export const {
  setAudioStream,
  play,
  playSucceeded,
  pause,
  stop,
  setBuffering,
  set,
  reset,
  resetSuceeded,
  seek,
  error,
  incrementCount
} = slice.actions

export default slice.reducer
