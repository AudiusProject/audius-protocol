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
import { TanQueryLineup } from 'app/components/lineup'
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
  const { data, isFetching, loadNextPage, isPending, hasNextPage } =
    useSearchTrackResults({
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
  if ((!data || data.length === 0) && !isPending) {
    return <NoResultsTile />
  }

  return (
    <Flex h='100%' backgroundColor='default'>
      <TanQueryLineup
        actions={searchResultsPageTracksLineupActions}
        pageSize={20}
        isFetching={isFetching}
        loadNextPage={loadNextPage}
        hasMore={hasNextPage}
        isPending={isPending}
        queryData={data}
        keyboardShouldPersistTaps='handled'
        onPressItem={handlePress}
        ListFooterComponent={<Flex h={200} />}
        hidePlayBarChin={false}
      />
    </Flex>
  )
}
