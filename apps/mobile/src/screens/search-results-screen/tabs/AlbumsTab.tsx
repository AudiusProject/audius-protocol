import type { CommonState } from '@audius/common'
import { useProxySelector, SearchKind } from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'

const selectSearchAlbums = (state: CommonState) =>
  state.pages.searchResults.albumIds
    ?.map((albumId) => {
      const album = state.collections.entries[albumId].metadata
      const user = state.users.entries[album.playlist_owner_id].metadata
      const trackCount = album.playlist_contents.track_ids.length
      return { ...album, user, trackCount }
    })
    .filter((album) => album.user && !album.user.is_deactivated)

export const AlbumsTab = () => {
  const albums = useProxySelector(selectSearchAlbums, [])
  useFetchTabResultsEffect(SearchKind.ALBUMS)

  return (
    <SearchResultsTab noResults={albums && albums.length === 0}>
      <CollectionList listKey='search-albums' collection={albums} />
    </SearchResultsTab>
  )
}
