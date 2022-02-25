import { getSearchTracksLineup } from 'audius-client/src/common/store/pages/search-results/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import { isEqual } from 'lodash'

import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { SearchResultsTab } from './SearchResultsTab'

export const TracksTab = () => {
  const lineup = useSelectorWeb(getSearchTracksLineup, isEqual)

  return (
    <SearchResultsTab noResults={lineup?.entries.length === 0}>
      <Lineup actions={tracksActions} lineup={lineup} />
    </SearchResultsTab>
  )
}
