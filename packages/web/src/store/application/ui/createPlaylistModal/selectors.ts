import { getCollection } from 'common/store/cache/collections/selectors'
import { getTracks as getCachedTracks } from 'common/store/cache/tracks/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

export const getBaseState = (state: AppState) =>
  state.application.ui.createPlaylistModal

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getId = (state: AppState) => getBaseState(state).collectionId

export const getMetadata = (state: AppState) => {
  const id = getId(state)
  if (!id) return null
  return getCollection(state, { id })
}

export const getTracks = (state: AppState) => {
  const metadata = getMetadata(state)
  if (!metadata) return null

  const trackIds = metadata.playlist_contents.track_ids.map(t => t.track)
  const tracks = getCachedTracks(state, { ids: trackIds })
  const userIds = Object.keys(tracks).map(
    trackId => tracks[(trackId as unknown) as number].owner_id
  )
  const users = getUsers(state, { ids: userIds })

  return trackIds.map(id => ({
    ...tracks[id],
    user: users[tracks[id].owner_id]
  }))
}
