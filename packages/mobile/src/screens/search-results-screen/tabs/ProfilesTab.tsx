import type { CommonState } from '@audius/common'
import { SearchKind, useProxySelector } from '@audius/common'

import { ArtistCard } from 'app/components/artist-card'
import { CardList } from 'app/components/core'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'

const selectSearchUsers = (state: CommonState) =>
  state.pages.searchResults.artistIds
    ?.map((artistId) => state.users.entries[artistId].metadata)
    .filter((artist) => !artist.is_deactivated)

export const ProfilesTab = () => {
  const users = useProxySelector(selectSearchUsers, [])

  useFetchTabResultsEffect(SearchKind.USERS)

  return (
    <SearchResultsTab noResults={users && users.length === 0}>
      <CardList
        data={users}
        renderItem={({ item }) => <ArtistCard artist={item} />}
      />
    </SearchResultsTab>
  )
}
