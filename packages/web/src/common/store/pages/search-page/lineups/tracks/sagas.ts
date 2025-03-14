import { Track } from '@audius/common/models'
import {
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

const { getSearchTracksLineup } = searchResultsPageSelectors

class SearchPageResultsSagas extends LineupSagas<Track> {
  constructor() {
    super(
      tracksActions.prefix,
      tracksActions,
      getSearchTracksLineup,
      ({ payload }) => payload?.tracks
    )
  }
}

export default function sagas() {
  return new SearchPageResultsSagas().getSagas()
}
