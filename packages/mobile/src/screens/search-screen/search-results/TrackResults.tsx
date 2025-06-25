import { useCallback } from 'react'

import { useSearchTrackResults } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { Kind, Name, Status } from '@audius/common/models'
import {
  searchResultsPageTracksLineupActions,
  searchActions
} from '@audius/common/store'
import { Keyboard } from 'react-native'
import { useDispatch } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'
import { make, track as record } from 'app/services/analytics'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import {
  useIsEmptySearch,
  useSearchFilters,
  useSearchQuery
} from '../searchState'

const { addItem: addRecentSearch } = searchActions

export const TrackResults = () => {
  const [query] = useSearchQuery()
  const [filters] = useSearchFilters()
  const { lineup, loadNextPage } = useSearchTrackResults({
    query,
    ...filters
  })
  const dispatch = useDispatch()
  const isEmptySearch = useIsEmptySearch()

  const handlePress = useCallback(
    (id: ID) => {
      Keyboard.dismiss()
      dispatch(
        addRecentSearch({
          searchItem: {
            kind: Kind.TRACKS,
            id
          }
        })
      )

      record(
        make({
          eventName: Name.SEARCH_RESULT_SELECT,
          term: query,
          source: 'search results page',
          id,
          kind: 'track'
        })
      )
    },
    [dispatch, query]
  )

  if (isEmptySearch) return <SearchCatalogTile />
  if (
    (!lineup || lineup.entries.length === 0) &&
    lineup.status === Status.SUCCESS
  ) {
    return <NoResultsTile />
  }

  return (
    <Flex h='100%' backgroundColor='default'>
      <Lineup
        tanQuery
        actions={searchResultsPageTracksLineupActions}
        lineup={lineup}
        loadMore={loadNextPage}
        keyboardShouldPersistTaps='handled'
        onPressItem={handlePress}
      />
    </Flex>
  )
}
