import { searchResultsPageSelectors } from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'
const { makeGetSearchPlaylists } = searchResultsPageSelectors

const getSearchPlaylists = makeGetSearchPlaylists()

export const PlaylistsTab = () => {
  const playlists = useSelectorWeb(getSearchPlaylists, isEqual)

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
