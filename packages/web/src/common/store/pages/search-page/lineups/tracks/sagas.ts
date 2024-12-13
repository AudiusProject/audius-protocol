import { searchApiFetchSaga } from '@audius/common/api'
import { Track } from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksSelectors,
  getContext,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { select, call } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
import { isMobileWeb } from 'common/utils/isMobileWeb'

const { getSearchTracksLineup, getSearchResultsPageTracks } =
  searchResultsPageSelectors
const { getTracks } = cacheTracksSelectors
const { getUserId } = accountSelectors

function* getSearchPageResultsTracks({
  offset,
  limit,
  payload: { category, query, filters }
}: {
  offset: number
  limit: number
  payload?: any
}) {
  const isNativeMobile = yield* getContext('isNativeMobile')

  if (
    category === SearchKind.TRACKS ||
    isNativeMobile ||
    isMobileWeb() ||
    category === SearchKind.ALL
  ) {
    const currentUserId = yield* select(getUserId)
    // searchApiFetch.getSearchResults handles tag search automatically based on query,
    const { tracks }: { tracks: Track[] } = yield* call(
      searchApiFetchSaga.getSearchResults,
      {
        currentUserId,
        query,
        category,
        limit,
        offset,
        ...filters
      }
    )
    return tracks
  } else {
    // If we are part of the all results search page
    try {
      const trackIds = yield* select(getSearchResultsPageTracks)

      // getTracks returns an unsorted map of ID to track metadata.
      // We sort this object by trackIds, which is returned sorted by discprov.
      const tracks = yield* select(getTracks, { ids: trackIds })

      const sortedTracks = trackIds.map((id) => tracks[id])
      return sortedTracks as Track[]
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

class SearchPageResultsSagas extends LineupSagas<Track> {
  constructor() {
    super(
      tracksActions.prefix,
      tracksActions,
      getSearchTracksLineup,
      getSearchPageResultsTracks
    )
  }
}

export default function sagas() {
  return new SearchPageResultsSagas().getSagas()
}
