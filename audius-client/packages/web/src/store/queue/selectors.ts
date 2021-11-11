import { createSelector } from 'reselect'

import { UID } from 'common/models/Identifiers'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getUid as getPlayerUid,
  getTrackId as getPlayerTrackId
} from 'store/player/selectors'
import { AppState } from 'store/types'

export const getOrder = (state: AppState) => state.queue.order
export const getLength = (state: AppState) => state.queue.order.length
export const getOvershot = (state: AppState) => state.queue.overshot
export const getUndershot = (state: AppState) => state.queue.undershot
export const getPositions = (state: AppState) => state.queue.positions
export const getIndex = (state: AppState) => state.queue.index
export const getRepeat = (state: AppState) => state.queue.repeat
export const getQueueAutoplay = (state: AppState) => state.queue.queueAutoplay
export const getShuffle = (state: AppState) => state.queue.shuffle
export const getShuffleIndex = (state: AppState) => state.queue.shuffleIndex
export const getShuffleOrder = (state: AppState) => state.queue.shuffleOrder
export const getUidInQueue = (state: AppState, props: { uid: UID }) =>
  props.uid in getPositions(state)

const isQueueIndexValid = (state: AppState) =>
  state.queue.index >= 0 &&
  state.queue.order.length > 0 &&
  state.queue.index < state.queue.order.length

export const getUid = (state: AppState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].uid : null
export const getSource = (state: AppState) =>
  isQueueIndexValid(state) ? state.queue.order[state.queue.index].source : null
export const getId = (state: AppState) =>
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
