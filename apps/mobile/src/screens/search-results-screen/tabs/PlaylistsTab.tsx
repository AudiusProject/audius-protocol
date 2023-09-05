import type { CommonState } from '@audius/common'
import { useProxySelector, SearchKind } from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'

const selectSearchPlaylists = (state: CommonState) =>
  state.pages.searchResults.playlistIds
    ?.map((playlistId) => {
      const playlist = state.collections.entries[playlistId].metadata
      const user = state.users.entries[playlist.playlist_owner_id].metadata
      const trackCount = playlist.playlist_contents.track_ids.length
      return { ...playlist, user, trackCount }
    })
    .filter((playlist) => playlist.user && !playlist.user.is_deactivated)

export const PlaylistsTab = () => {
  const playlists = useProxySelector(selectSearchPlaylists, [])
  useFetchTabResultsEffect(SearchKind.PLAYLISTS)

  return (
    <SearchResultsTab noResults={playlists && playlists.length === 0}>
      <CollectionList listKey='search-playlists' collection={playlists} />
    </SearchResultsTab>
  )
}
