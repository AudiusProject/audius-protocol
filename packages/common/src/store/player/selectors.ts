import { createSelector } from 'reselect'

import { cacheTracksSelectors, cacheUsersSelectors } from '../cache'
import { CommonState } from '../commonStore'
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

export const getHasTrack = (state: CommonState) => !!state.player.trackId
export const getUid = (state: CommonState) => state.player.uid
export const getTrackId = (state: CommonState) => state.player.trackId
export const getCollectible = (state: CommonState) => state.player.collectible

export const getPlaying = (state: CommonState) => state.player.playing
export const getPreviewing = (state: CommonState) => state.player.previewing
export const getPaused = (state: CommonState) => !state.player.playing
export const getCounter = (state: CommonState) => state.player.counter
export const getBuffering = (state: CommonState) => state.player.buffering
export const getSeek = (state: CommonState) => state.player.seek
export const getSeekCounter = (state: CommonState) => state.player.seekCounter
export const getPlaybackRate = (state: CommonState) => state.player.playbackRate
export const getPlayerBehavior = (state: CommonState) =>
  state.player.playerBehavior

export const getCurrentTrack = (state: CommonState) =>
  getTrack(state, { id: getTrackId(state) })

const getCurrentUser = (state: CommonState) => {
  const track = getCurrentTrack(state)
  if (track) {
    return getUser(state, { id: track.owner_id })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getUid, getCurrentTrack, getCurrentUser, getCollectible],
    (uid, track, user, collectible) => ({
      uid,
      track,
      user,
      collectible
    })
  )
}

export const getPlaybackRetryCount = (state: CommonState) =>
  state.player.retries
