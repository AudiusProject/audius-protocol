import type { ID } from '@audius/common/models'
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { useSelector } from 'react-redux'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

export const useTrackSearchResultSelect = (
  kind: 'track' | 'profile' | 'playlist' | 'album'
) => {
  const searchQuery: string = useSelector(getSearchBarText)
  const trackSearchResultSelect = (id: ID) => {
    track(
      make({
        eventName: EventNames.SEARCH_RESULT_SELECT,
        term: searchQuery,
        source: 'more results page',
        kind,
        id
      })
    )
  }
  return trackSearchResultSelect
}
