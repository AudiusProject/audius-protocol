import { useCallback, useContext } from 'react'

import {
  lineupSelectors,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { SearchQueryContext } from '../SearchQueryContext'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)

export const TracksTab = ({ route }) => {
  const { trackSearchResultSelect } = route.params // make hook
  const lineup = useSelector(getSearchTracksLineupMetadatas)
  const dispatch = useDispatch()
  const { query, isTagSearch } = useContext(SearchQueryContext)
  const loadMore = useCallback(
    (offset: number, limit: number) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          category: SearchKind.TRACKS,
          query,
          isTagSearch
        })
      )
    },
    [dispatch, isTagSearch, query]
  )

  useFetchTabResultsEffect(SearchKind.TRACKS)
  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup
        actions={tracksActions}
        lineup={lineup}
        loadMore={loadMore}
        onPressItem={trackSearchResultSelect}
      />
    </SearchResultsTab>
  )
}
