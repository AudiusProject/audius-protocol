import { useCallback, useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { Kind, Name, Status } from '@audius/common/models'
import {
  lineupSelectors,
  searchResultsPageTracksLineupActions,
  searchResultsPageSelectors,
  SearchKind,
  searchActions
} from '@audius/common/store'
import { Keyboard } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

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

const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)
const { addItem: addRecentSearch } = searchActions

export const TrackResults = () => {
  const [query] = useSearchQuery()
  const [filters] = useSearchFilters()
  const dispatch = useDispatch()
  const isEmptySearch = useIsEmptySearch()

  const lineup = useSelector(getSearchTracksLineupMetadatas)

  const getResults = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(
        searchResultsPageTracksLineupActions.fetchLineupMetadatas(
          offset,
          limit,
          overwrite,
          {
            category: SearchKind.TRACKS,
            query,
            filters,
            dispatch
          }
        )
      )
    },
    [dispatch, query, filters]
  )

  useEffect(() => {
    dispatch(searchResultsPageTracksLineupActions.reset())
  }, [dispatch, query, filters])

  useDebounce(
    () => {
      getResults(0, 10, true)
    },
    500,
    [dispatch, getResults, query, filters]
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      getResults(offset, limit, false)
    },
    [getResults]
  )

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
        actions={searchResultsPageTracksLineupActions}
        lineup={lineup}
        loadMore={loadMore}
        keyboardShouldPersistTaps='handled'
        onPressItem={handlePress}
      />
    </Flex>
  )
}
