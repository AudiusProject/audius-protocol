import { createSelector } from 'reselect'

import { UID } from '../../models'
import { Uid } from '../../utils/uid'
import { cacheUsersSelectors, cacheTracksSelectors } from '../cache'
import { playerSelectors } from '../player'
import { CommonState } from '../reducers'

const { getUid: getPlayerUid, getTrackId: getPlayerTrackId } = playerSelectors
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

export const getOrder = (state: CommonState) => state.queue.order
export const getLength = (state: CommonState) => state.queue.order.length
export const getOvershot = (state: CommonState) => state.queue.overshot
export const getUndershot = (state: CommonState) => state.queue.undershot
export const getPositions = (state: CommonState) => state.queue.positions
export const getIndex = (state: CommonState) => state.queue.index
export const getRepeat = (state: CommonState) => state.queue.repeat
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
export const getCollectible = (state: CommonState) => {
  if (!isQueueIndexValid(state)) return null
  return state.queue.order[state.queue.index].collectible ?? null
}
export const getCollectionId = (state: CommonState) => {
  const uid = getUid(state)
  if (!uid) return null
  return Uid.getCollectionId(uid)
}

const getCurrentTrack = (state: CommonState) =>
  getTrack(state, { id: getPlayerTrackId(state) })

export const getCurrentArtist = (state: CommonState) => {
  const track = getCurrentTrack(state)
  const queueable = state.queue.order[state.queue.index]
  if (track || queueable?.artistId) {
    return getUser(state, { id: track?.owner_id ?? queueable.artistId })
  }
  return null
}

export const makeGetCurrent = () => {
  return createSelector(
    [
      getPlayerUid,
      getSource,
      getCurrentTrack,
      getCurrentArtist,
      getCollectible
    ],
    (uid, source, track, user, collectible) => ({
      uid,
      source,
      track,
      user,
      collectible
    })
  )
}
