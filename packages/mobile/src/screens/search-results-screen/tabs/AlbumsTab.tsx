import { searchResultsPageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { SearchResultsTab } from './SearchResultsTab'
const { makeGetSearchAlbums } = searchResultsPageSelectors

const getSearchAlbums = makeGetSearchAlbums()

export const AlbumsTab = () => {
  const albums = useSelector(getSearchAlbums)

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
