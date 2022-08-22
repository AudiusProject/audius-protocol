import { searchResultsPageSelectors } from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'
const { makeGetSearchAlbums } = searchResultsPageSelectors

const getSearchAlbums = makeGetSearchAlbums()

export const AlbumsTab = () => {
  const albums = useSelectorWeb(getSearchAlbums, isEqual)

  return (
    <SearchResultsTab noResults={albums.length === 0}>
      <CollectionList
        listKey='search-albums'
        collection={albums}
        fromPage='search'
      />
    </SearchResultsTab>
  )
}
