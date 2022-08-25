import {
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors
} from '@audius/common'
import { useSelector } from 'react-redux'

import { Lineup } from 'app/components/lineup'

import { SearchResultsTab } from './SearchResultsTab'
const { getSearchTracksLineup } = searchResultsPageSelectors

export const TracksTab = () => {
  const lineup = useSelector(getSearchTracksLineup)

  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup actions={tracksActions} lineup={lineup} />
    </SearchResultsTab>
  )
}
