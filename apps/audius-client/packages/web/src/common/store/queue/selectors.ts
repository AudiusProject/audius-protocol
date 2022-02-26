import { createSelector } from 'reselect'

import { UID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getUid as getPlayerUid,
  getTrackId as getPlayerTrackId
} from 'store/player/selectors'
import { AppState } from 'store/types'

export const getOrder = (state: CommonState) => state.queue.order
export const getLength = (state: CommonState) => state.queue.order.length
export const getOvershot = (state: CommonState) => state.queue.overshot
export const getUndershot = (state: CommonState) => state.queue.undershot
export const getPositions = (state: CommonState) => state.queue.positions
export const getIndex = (state: CommonState) => state.queue.index
export const getRepeat = (state: CommonState) => state.queue.repeat
export const getQueueAutoplay = (state: CommonState) =>
  state.queue.queueAutoplay
export const getShuffle = (state: CommonState) => state.queue.shuffle
export const getShuffleIndex = (state: CommonState) => state.queue.shuffleIndex
export const getShuffleOrder = (state: CommonState) => state.queue.shuffleOrder
export const getUidInQueue = (state: CommonState, props: { uid: UID }) =>
  props.uid in getPositions(state)

const isQueueIndexValid = (state: CommonState) =>
  state.queue.index >= 0 &&
  state.queue.order.length > 0 &&
  state.queue.index < state.queue.order.length

export const getUid = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].uid : null
export const getSource = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].source : null
export const getId = (state: CommonState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].id : null

const getCurrentTrack = (state: AppState) =>
  getTrack(state, { id: getPlayerTrackId(state) })
const getCurrentUser = (state: AppState) => {
  const track = getCurrentTrack(state)
  if (track) {
    return getUser(state, { id: track.owner_id })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [getPlayerUid, getSource, getCurrentTrack, getCurrentUser],
    (uid, source, track, user) => ({
      uid,
      source,
      track,
      user
    })
  )
}
