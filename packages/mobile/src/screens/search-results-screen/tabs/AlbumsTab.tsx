import { makeGetSearchAlbums } from 'audius-client/src/common/store/pages/search-results/selectors'
import { isEqual } from 'lodash'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

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
