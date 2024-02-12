import { StemTrack } from '~/models/Track'
import { cacheTracksSelectors } from '~/store/cache'
import { CommonState } from '~/store/commonStore'

const { getTrack, getTracks } = cacheTracksSelectors

export const getBaseState = (state: CommonState) => state.ui.modals.EditTrack

export const getIsOpen = (state: CommonState) => getBaseState(state).isOpen
export const getTrackId = (state: CommonState) => getBaseState(state).trackId

export const getMetadata = (state: CommonState) => {
  const trackId = getTrackId(state)
  return getTrack(state, { id: trackId })
}

export const getStems = (state: CommonState) => {
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
