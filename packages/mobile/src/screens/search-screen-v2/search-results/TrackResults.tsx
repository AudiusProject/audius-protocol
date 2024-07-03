import { Flex, Text, useTheme } from '@audius/harmony-native'

import {
  lineupSelectors,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { useSearchQuery } from '../searchState'
import { Lineup } from 'app/components/lineup'
import { useSelector } from 'react-redux'
import { useCallback, useEffect } from 'react'
import { dispatch } from 'app/store'
import { useFocusEffect } from '@react-navigation/native'

const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)

export const TrackResults = () => {
  const [query] = useSearchQuery()

  const lineup = useSelector(getSearchTracksLineupMetadatas)

  useFocusEffect(
    useCallback(() => {
      dispatch(
        tracksActions.fetchLineupMetadatas(0, 10, true, {
          category: SearchKind.TRACKS,
          query,
          // TODO: implement tag search
          isTagSearch: false
        })
      )
    }, [dispatch, query])
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          category: SearchKind.TRACKS,
          query,
          // TODO: implement tag search
          isTagSearch: false
        })
      )
    },
    [dispatch, query]
  )

  return (
    <Flex h='100%' backgroundColor='default'>
      <Lineup
        selfLoad
        actions={tracksActions}
        lineup={lineup}
        loadMore={loadMore}
      />
    </Flex>
  )
}
