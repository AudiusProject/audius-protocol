import { makeGetSearchArtists } from 'audius-client/src/common/store/pages/search-results/selectors'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

const getSearchUsers = makeGetSearchArtists()

export const ProfilesTab = () => {
  const users = useSelectorWeb(getSearchUsers)

  return (
    <SearchResultsTab noResults={users.length === 0}>
      <CardList
        data={users}
        renderItem={({ item }) => (
          <ArtistCard artist={item} fromPage='search' />
        )}
      />
    </SearchResultsTab>
  )
}
