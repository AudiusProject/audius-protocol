import { createSelector } from 'reselect'

import type { AppState } from 'app/store'

import { RepeatMode } from './reducer'

const getBaseState = (state: AppState) => state.audio

export const getTrack = (state: AppState) => {
  const baseState = getBaseState(state)
  // An index of -1, signals no audio is ready to be played back
  return baseState.index >= 0 ? baseState.queue[baseState.index] : null
}
export const getPlaying = (state: AppState) => getBaseState(state).playing
export const getPlayingUid = (state: AppState) => {
  const { index, queue } = getBaseState(state)
  return queue[index]?.uid
}
export const getIndex = (state: AppState) => getBaseState(state).index
export const getQueueLength = (state: AppState) =>
  getBaseState(state).queue.length
export const getSeek = (state: AppState) => getBaseState(state).seek
export const getIsRepeatSingle = (state: AppState) =>
  getBaseState(state).repeatMode === RepeatMode.SINGLE
export const getRepeatMode = (state: AppState) => getBaseState(state).repeatMode
export const getIsShuffleOn = (state: AppState) => getBaseState(state).shuffle
export const getShuffleIndex = (state: AppState) =>
  getBaseState(state).shuffleIndex
export const getQueueAutoplay = (state: AppState) =>
  getBaseState(state).queueAutoplay

export const getTrackAndIndex = createSelector(
  [getTrack, getIndex],
  (track, index) => ({ track, index })
)
