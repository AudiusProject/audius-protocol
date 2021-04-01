import {
  AudioActions,
  PLAY,
  PAUSE,
  NEXT,
  PREVIOUS,
  SEEK,
  PERSIST_QUEUE,
  REPEAT,
  RESET
} from './actions'
import { track, make } from '../../utils/analytics'
import { EventNames, PlaybackSource } from '../../types/analytics'

type Uri = string

type Info = {
  uid: string
  title: string
  artist: string
  artwork: string
  largeArtwork: string
  trackId: number
  currentUserId: number
  ownerId: number
  currentListenCount: number
  uri: Uri
}

export enum RepeatMode {
  OFF = 'OFF',
  ALL = 'ALL',
  SINGLE = 'SINGLE'
}

export type AudioState = {
  index: number
  queue: Info[]
  playing: boolean
  seek: number | null
  repeatMode: RepeatMode
}

const initialState: AudioState = {
  index: -1,
  queue: [],
  playing: false,
  seek: null,
  repeatMode: RepeatMode.OFF
}

const reducer = (
  state: AudioState = initialState,
  action: AudioActions
): AudioState => {
  switch (action.type) {
    case PLAY:
      return {
        ...state,
        playing: true
      }
    case PAUSE:
      return {
        ...state,
        playing: false
      }
    case NEXT: {
      let newIndex
      if (state.repeatMode === RepeatMode.SINGLE) {
        newIndex = state.index
      } else {
        newIndex =
          state.index < state.queue.length - 1
            ? state.index + 1
            : state.repeatMode === RepeatMode.ALL
            ? 0
            : -1
      }
      const playing = newIndex !== -1

      // Side-Effect (yes, this shouldn't be in a reducer, but
      // maybe not worth including sagas/thunks)
      if (playing) {
        track(
          make({
            eventName: EventNames.PLAYBACK_PLAY,
            id: `${state.queue[newIndex].trackId}`,
            source: PlaybackSource.PASSIVE
          })
        )
      }

      return {
        ...state,
        index: newIndex,
        playing
      }
    }
    case PREVIOUS: {
      const newIndex = state.index > 0 ? state.index - 1 : -1

      // Side-Effect (yes, this shouldn't be in a reducer, but
      // maybe not worth including sagas/thunks)
      if (state.playing) {
        track(
          make({
            eventName: EventNames.PLAYBACK_PLAY,
            id: `${state.queue[newIndex].trackId}`,
            source: PlaybackSource.PASSIVE
          })
        )
      }

      return {
        ...state,
        index: newIndex
      }
    }
    case SEEK:
      return {
        ...state,
        seek: action.message.seconds
      }
    case PERSIST_QUEUE:
      return {
        ...state,
        queue: action.message.tracks,
        index: action.message.index
      }
    case REPEAT:
      return {
        ...state,
        repeatMode: action.message.repeatMode
      }
    case RESET:
      return {
        index: -1,
        queue: [],
        playing: false,
        seek: null,
        repeatMode: RepeatMode.OFF
      }
    default:
      return state
  }
}

export default reducer
