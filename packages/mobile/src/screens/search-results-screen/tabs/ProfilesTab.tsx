import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { searchResultsPageSelectors, SearchKind } from '@audius/common/store'

import { ProfileList } from 'app/components/profile-list'
import { spacing } from 'app/styles/spacing'

import { EmptyResults } from '../EmptyResults'

import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'

const { getSearchStatus } = searchResultsPageSelectors

const selectSearchUsers = (state: CommonState) => {
  const searchStatus = getSearchStatus(state)
  if (searchStatus === Status.LOADING) return undefined

  return state.pages.searchResults.artistIds
    ?.map((artistId) => state.users.entries[artistId].metadata)
    .filter((artist) => !artist.is_deactivated)
}

export const ProfilesTab = ({ route }) => {
  const { onCardPress } = route.params
  console.log('asdf profile tab on press: ', route.params)
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
