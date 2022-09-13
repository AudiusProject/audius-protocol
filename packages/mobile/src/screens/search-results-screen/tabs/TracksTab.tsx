import {
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common'
import { useSelector } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { SearchResultsTab } from './SearchResultsTab'
import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
const { getSearchTracksLineup } = searchResultsPageSelectors

export const TracksTab = () => {
  const lineup = useSelector(getSearchTracksLineup)
  useFetchTabResultsEffect(SearchKind.TRACKS)
  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup actions={tracksActions} lineup={lineup} />
    </SearchResultsTab>
  )
}
