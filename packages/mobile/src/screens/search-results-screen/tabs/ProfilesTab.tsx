import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { searchResultsPageSelectors, SearchKind } from '@audius/common/store'

import { ProfileList } from 'app/components/profile-list'
import { spacing } from 'app/styles/spacing'

import { EmptyResults } from '../EmptyResults'

import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
import { useTrackSearchResultSelect } from './useTrackSearchResultSelect'

const { getSearchStatus } = searchResultsPageSelectors
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { useSelector } from 'react-redux'

const selectSearchUsers = (state: CommonState) => {
  const searchStatus = getSearchStatus(state)
  if (searchStatus === Status.LOADING) return undefined

  return state.pages.searchResults.artistIds
    ?.map((artistId) => state.users.entries[artistId].metadata)
    .filter((artist) => !artist.is_deactivated)
}

export const ProfilesTab = () => {
  const searchQuery: string = useSelector(getSearchBarText)
  const onCardPress = useTrackSearchResultSelect(searchQuery, 'profile')
  console.log('asdf ProfilesTab: ', searchQuery, onCardPress)
  const users = useProxySelector(selectSearchUsers, [])

  useFetchTabResultsEffect(SearchKind.USERS)

  return (
    <ProfileList
      style={{ paddingTop: spacing(3) }}
      onCardPress={onCardPress}
      isLoading={!users}
      profiles={users}
      ListEmptyComponent={<EmptyResults />}
    />
  )
}
