import { CommonState } from 'common/store'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getTracks as getCachedTracks } from 'common/store/cache/tracks/selectors'
import { getUsers } from 'common/store/cache/users/selectors'

export const getBaseState = (state: CommonState) => state.ui.createPlaylistModal

export const getIsOpen = (state: CommonState) => getBaseState(state).isOpen
export const getId = (state: CommonState) => getBaseState(state).collectionId
export const getHideFolderTab = (state: CommonState) =>
  getBaseState(state).hideFolderTab

export const getMetadata = (state: CommonState) => {
  const id = getId(state)
  if (!id) return null
  return getCollection(state, { id })
}

export const getTracks = (state: CommonState) => {
  const metadata = getMetadata(state)
  if (!metadata) return null

  const trackIds = metadata.playlist_contents.track_ids.map((t) => t.track)
  const tracks = getCachedTracks(state, { ids: trackIds })
  const userIds = Object.keys(tracks).map(
    (trackId) => tracks[trackId as unknown as number].owner_id
  )
  const users = getUsers(state, { ids: userIds })

  return trackIds.map((id) => ({
    ...tracks[id],
    user: users[tracks[id].owner_id]
  }))
}
