import { ID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'
import {
  getTrack as getCachedTrack,
  getStatus as getCachedTrackStatus
} from 'common/store/cache/tracks/selectors'
import { getUser as getCachedUser } from 'common/store/cache/users/selectors'
import { PREFIX } from 'common/store/pages/track/lineup/actions'

export const getBaseState = (state: CommonState) => state.pages.track

export const getTrackId = (state: CommonState) => getBaseState(state).trackId
export const getTrackPermalink = (state: CommonState) =>
  getBaseState(state).trackPermalink
export const getTrack = (state: CommonState) => {
  const id = getTrackId(state)
  if (id) {
    return getCachedTrack(state, { id })
  }
  const permalink = getTrackPermalink(state)
  return getCachedTrack(state, { permalink })
}

export const getRemixParentTrack = (state: CommonState) => {
  const cachedTrack = getTrack(state)
  const parentTrackId = cachedTrack?.remix_of?.tracks?.[0].parent_track_id
  if (parentTrackId) {
    const parentTrack = getCachedTrack(state, { id: parentTrackId })
    // Get user for deactivated status
    const parentTrackUser = getCachedUser(state, { id: parentTrack?.owner_id })
    if (parentTrack && parentTrackUser) {
      return { ...parentTrack, user: parentTrackUser }
    }
  }
  return null
}

export const getUser = (state: CommonState) => {
  const track = getTrack(state)
  if (!track) return null
  return getCachedUser(state, { id: track.owner_id })
}
export const getStatus = (state: CommonState) =>
  getCachedTrackStatus(state, { id: getTrackId(state) as ID })

export const getLineup = (state: CommonState) => getBaseState(state).tracks
export const getTrackRank = (state: CommonState) => getBaseState(state).rank
export const getTrendingTrackRanks = (state: CommonState) => {
  const ranks = getBaseState(state).trendingTrackRanks
  if (!ranks.week && !ranks.month && !ranks.year) return null
  return ranks
}
export const getSourceSelector = (state: CommonState) =>
  `${PREFIX}:${getTrackId(state)}`
