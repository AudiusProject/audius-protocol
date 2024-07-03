import { useCallback, useEffect } from 'react'

import {
  lineupSelectors,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'

import { useSearchQuery } from '../searchState'

const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)

export const TrackResults = () => {
  const [query] = useSearchQuery()
  const dispatch = useDispatch()

  const lineup = useSelector(getSearchTracksLineupMetadatas)

  useEffect(() => {
    dispatch(
      tracksActions.fetchLineupMetadatas(0, 10, true, {
        category: SearchKind.TRACKS,
        query,
        // TODO: implement tag search
        isTagSearch: false,
        dispatch
      })
    )
  }, [dispatch, query])

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          category: SearchKind.TRACKS,
          query,
          // TODO: implement tag search
          isTagSearch: false,
          dispatch
        })
      )
    },
    [dispatch, query]
  )

  return (
    <Flex h='100%' backgroundColor='default'>
      <Lineup actions={tracksActions} lineup={lineup} loadMore={loadMore} />
    </Flex>
  )
}
