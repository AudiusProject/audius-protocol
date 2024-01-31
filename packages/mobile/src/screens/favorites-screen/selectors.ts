import type { CommonState } from '@audius/common/store'

import type { Cacheable, Collection, ID, User } from '@audius/common/models'

const matchesFilter = (
  playlist: Collection,
  users: Record<ID, Cacheable<User>>,
  filterValue: string
) => {
  const matchValue = filterValue.toLowerCase()
  const { playlist_name, playlist_owner_id } = playlist
  const playlistOwner = users[playlist_owner_id].metadata

  return (
    !playlistOwner.is_deactivated &&
    (playlist_name.toLowerCase().indexOf(matchValue) > -1 ||
      playlistOwner.name.toLowerCase().indexOf(matchValue) > -1)
  )
}

export const getAccountCollections = (state: CommonState, filterValue = '') => {
  const collectionEntries = state.collections?.entries
  const { collections } = state.account
  if (!collectionEntries) return []
  return Object.values(collections)
    .map((collection) => collectionEntries[collection.id]?.metadata)
    ?.filter(
      (playlist) =>
        playlist &&
        !playlist._marked_deleted &&
        !playlist.is_delete &&
        matchesFilter(playlist, state.users.entries, filterValue)
    )
    .sort((a, b) =>
      a.playlist_name.toLowerCase().localeCompare(b.playlist_name.toLowerCase())
    )
}
