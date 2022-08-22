import { StemTrack, cacheTracksSelectors } from '@audius/common'

import { AppState } from 'store/types'
const { getTrack, getTracks } = cacheTracksSelectors

export const getBaseState = (state: AppState) =>
  state.application.ui.editTrackModal

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getTrackId = (state: AppState) => getBaseState(state).trackId

export const getMetadata = (state: AppState) => {
  const trackId = getTrackId(state)
  return getTrack(state, { id: trackId })
}

export const getStems = (state: AppState) => {
  const trackId = getTrackId(state)
  if (!trackId) return []

  const track = getTrack(state, { id: trackId })
  if (!track?._stems?.length) return []

  const stemIds = track._stems.map((s) => s.track_id)

  const stemsMap = getTracks(state, { ids: stemIds }) as {
    [id: number]: StemTrack
  }
  const stems = Object.values(stemsMap).filter(
    (t) => !t.is_delete && !t._marked_deleted
  )
  return stems
}
