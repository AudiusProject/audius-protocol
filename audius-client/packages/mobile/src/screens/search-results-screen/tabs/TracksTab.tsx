import { tracksActions } from 'audius-client/src/common/store/pages/search-results/lineup/tracks/actions'
import { getSearchTracksLineup } from 'audius-client/src/common/store/pages/search-results/selectors'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

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
