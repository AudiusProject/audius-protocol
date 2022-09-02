import { SearchKind, searchResultsPageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
const { makeGetSearchPlaylists } = searchResultsPageSelectors

const getSearchPlaylists = makeGetSearchPlaylists()

export const PlaylistsTab = () => {
  const playlists = useSelector(getSearchPlaylists)
  useFetchTabResultsEffect(SearchKind.PLAYLISTS)

  return (
    <SearchResultsTab noResults={playlists.length === 0}>
      <CollectionList
        listKey='search-playlists'
        collection={playlists}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}
