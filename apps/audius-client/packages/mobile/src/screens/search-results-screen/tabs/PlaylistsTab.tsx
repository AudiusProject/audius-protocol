import { makeGetSearchPlaylists } from 'audius-client/src/common/store/pages/search-results/selectors'
import { isEqual } from 'lodash'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

const getSearchPlaylists = makeGetSearchPlaylists()

export const PlaylistsTab = () => {
  const playlists = useSelectorWeb(getSearchPlaylists, isEqual)
  return (
    <SearchResultsTab noResults={playlists.length === 0}>
      <CollectionList listKey='search-playlists' collection={playlists} />
    </SearchResultsTab>
  )
}
