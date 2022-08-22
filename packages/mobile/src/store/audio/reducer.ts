import type { Genre } from '@audius/common'

import { track, make } from 'app/services/analytics'
import { EventNames, PlaybackSource } from 'app/types/analytics'

import type { AudioActions } from './actions'
import {
  PLAY,
  PAUSE,
  NEXT,
  PREVIOUS,
  SEEK,
  PERSIST_QUEUE,
  REPEAT,
  SHUFFLE,
  RESET
} from './actions'

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
  isDelete: boolean
  genre: Genre
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
  shuffle: boolean
  shuffleIndex: number
  shuffleOrder: number[]
  queueAutoplay: boolean
}

const initialState: AudioState = {
  index: -1,
  queue: [],
  playing: false,
  seek: null,
  repeatMode: RepeatMode.OFF,
  shuffle: false,
  shuffleIndex: -1,
  shuffleOrder: [],
  queueAutoplay: true
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
      let newShuffleIndex = state.shuffleIndex
      let playing = true
      if (state.repeatMode === RepeatMode.SINGLE) {
        newIndex = state.index
      } else if (state.shuffle) {
        newShuffleIndex =
          state.shuffleIndex < state.queue.length - 1
            ? state.shuffleIndex + 1
            : state.repeatMode === RepeatMode.ALL
            ? 0
            : -1
        newIndex =
          newShuffleIndex === -1
            ? newShuffleIndex
            : state.shuffleOrder[newShuffleIndex]
      } else {
        newIndex =
          state.index < state.queue.length - 1
            ? state.index + 1
            : state.repeatMode === RepeatMode.ALL
            ? 0
            : -1
      }
      playing = newIndex !== -1

      // Side-Effect (yes, this shouldn't be in a reducer, but
      // maybe not worth including sagas/thunks)
      if (playing) {
        const newTrack = state.queue[newIndex]
        if (newTrack) {
          track(
            make({
              eventName: EventNames.PLAYBACK_PLAY,
              id: `${newTrack.trackId}`,
              source: PlaybackSource.PASSIVE
            })
          )
        }
      }
      return {
        ...state,
        index: newIndex,
        shuffleIndex: newShuffleIndex,
        playing
      }
    }
    case PREVIOUS: {
      let newIndex = state.index > 0 ? state.index - 1 : 0
      let newShuffleIndex = state.shuffleIndex
      // Side-Effect (yes, this shouldn't be in a reducer, but
      // maybe not worth including sagas/thunks)
      if (state.playing) {
        const newTrack = state.queue[newIndex]
        if (newTrack) {
          track(
            make({
              eventName: EventNames.PLAYBACK_PLAY,
              id: `${newTrack.trackId}`,
              source: PlaybackSource.PASSIVE
            })
          )
        }
      }
      if (state.shuffle) {
        newShuffleIndex =
          state.shuffleIndex - 1 > 0
            ? state.shuffleIndex - 1
            : state.repeatMode === RepeatMode.ALL
            ? state.shuffleOrder.length - 1
            : -1
        newIndex = state.shuffleOrder[newShuffleIndex]
      }

      return {
        ...state,
        index: newIndex,
        shuffleIndex: newShuffleIndex
      }
    }
    case SEEK:
      return {
        ...state,
        seek: action.message.seconds
      }
    case REPEAT:
      return {
        ...state,
        repeatMode: action.message.repeatMode
      }
    case PERSIST_QUEUE:
      return {
        ...state,
        queue: action.message.tracks,
        index: action.message.index,
        shuffle: action.message.shuffle,
        shuffleIndex: action.message.shuffleIndex,
        shuffleOrder: action.message.shuffleOrder,
        queueAutoplay: action.message.queueAutoplay
      }
    case SHUFFLE:
      return {
        ...state,
        shuffle: action.message.shuffle,
        shuffleIndex: action.message.shuffleIndex,
        shuffleOrder: action.message.shuffleOrder
      }
    case RESET:
      return {
        index: -1,
        queue: [],
        playing: false,
        seek: null,
        repeatMode: RepeatMode.OFF,
        shuffle: false,
        shuffleIndex: -1,
        shuffleOrder: [],
        queueAutoplay: true
      }
    default:
      return state
  }
}

export default reducer
