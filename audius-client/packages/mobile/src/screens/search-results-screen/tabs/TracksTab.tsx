import {
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors
} from '@audius/common'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'
const { getSearchTracksLineup } = searchResultsPageSelectors

export const TracksTab = () => {
  const lineup = useSelectorWeb(getSearchTracksLineup, isEqual)

  return (
    <SearchResultsTab
      noResults={lineup?.entries.length === 0}
      status={lineup?.status}
    >
      <Lineup actions={tracksActions} lineup={lineup} />
    </SearchResultsTab>
  )
}
