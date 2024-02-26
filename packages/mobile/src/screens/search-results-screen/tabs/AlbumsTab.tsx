import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { searchResultsPageSelectors, SearchKind } from '@audius/common/store'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { spacing } from 'app/styles/spacing'

import { EmptyResults } from '../EmptyResults'

import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { useTrackSearchResultSelect } from './useTrackSearchResultSelect'
import { useSelector } from 'react-redux'


const { getSearchStatus } = searchResultsPageSelectors

const selectSearchAlbums = (state: CommonState) => {
  const searchStatus = getSearchStatus(state)
  if (searchStatus === Status.LOADING) return undefined

  return state.pages.searchResults.albumIds
    ?.map((albumId) => {
      const album = state.collections.entries[albumId].metadata
      const user = state.users.entries[album.playlist_owner_id].metadata
      const trackCount = album.playlist_contents.track_ids.length
      return { ...album, user, trackCount }
    })
    .filter((album) => album.user && !album.user.is_deactivated)
}

export const AlbumsTab = () => {
  const searchQuery: string = useSelector(getSearchBarText)
  const trackSearchResultSelect = useTrackSearchResultSelect(searchQuery, 'album')
  const albums = useProxySelector(selectSearchAlbums, [])
  useFetchTabResultsEffect(SearchKind.ALBUMS)

  return (
    <CollectionList
      style={{ paddingTop: spacing(3) }}
      isLoading={!albums}
      collection={albums}
      ListEmptyComponent={<EmptyResults />}
      onCollectionPress={trackSearchResultSelect}
    />
  )
}
