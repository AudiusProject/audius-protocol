import { SearchKind, searchResultsPageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
const { makeGetSearchArtists } = searchResultsPageSelectors

const getSearchUsers = makeGetSearchArtists()

export const ProfilesTab = () => {
  const users = useSelector(getSearchUsers)
  useFetchTabResultsEffect(SearchKind.USERS)
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
