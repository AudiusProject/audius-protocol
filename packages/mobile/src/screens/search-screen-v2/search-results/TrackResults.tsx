import { useCallback } from 'react'

import {
  lineupSelectors,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import { Flex } from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'

import { useSearchFilters, useSearchQuery } from '../searchState'

const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)

export const TrackResults = () => {
  const [query] = useSearchQuery()
  const filters = useSearchFilters()
  const dispatch = useDispatch()

  const lineup = useSelector(getSearchTracksLineupMetadatas)

  const getResults = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, overwrite, {
          category: SearchKind.TRACKS,
          query,
          filters,
          dispatch,
          // TODO: implement tag search
          isTagSearch: false
        })
      )
    },
    [dispatch, query, filters]
  )

  useDebounce(
    () => {
      getResults(0, 10, true)
    },
    500,
    [getResults]
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      getResults(offset, limit, false)
    },
    [getResults]
  )

  return (
    <Flex h='100%' backgroundColor='default'>
      <Lineup actions={tracksActions} lineup={lineup} loadMore={loadMore} />
    </Flex>
  )
}
