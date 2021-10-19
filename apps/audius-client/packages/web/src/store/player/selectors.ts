import { createSelector } from 'reselect'

import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

export const getHasTrack = (state: AppState) => !!state.player.trackId
export const getUid = (state: AppState) => state.player.uid
export const getTrackId = (state: AppState) => state.player.trackId
export const getAudio = (state: AppState) => state.player.audio

export const getPlaying = (state: AppState) => state.player.playing
export const getPaused = (state: AppState) => !state.player.playing
export const getCounter = (state: AppState) => state.player.counter
export const getBuffering = (state: AppState) => state.player.buffering

export const getCurrentTrack = (state: AppState) =>
  getTrack(state, { id: getTrackId(state) })
const getCurrentUser = (state: AppState) => {
  const track = getCurrentTrack(state)
  if (track) {
    return getUser(state, { id: track.owner_id })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getUid, getCurrentTrack, getCurrentUser],
    (uid, track, user) => ({
      uid,
      track,
      user
    })
  )
}
