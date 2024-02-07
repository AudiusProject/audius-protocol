import { Track } from '@audius/common/models'
import {
  cacheTracksSelectors,
  getContext,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageSelectors,
  SearchKind
} from '@audius/common/store'
import { trimToAlphaNumeric } from '@audius/common/utils'
import { select, all, call } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
import {
  getSearchResults,
  getTagSearchResults
} from 'common/store/pages/search-page/sagas'
import { isMobileWeb } from 'common/utils/isMobileWeb'

const { getSearchTracksLineup, getSearchResultsPageTracks } =
  searchResultsPageSelectors
const { getTracks } = cacheTracksSelectors

function* getSearchPageResultsTracks({
  offset,
  limit,
  payload: { category, query, isTagSearch }
}: {
  offset: number
  limit: number
  payload?: any
}) {
  const isNativeMobile = yield* getContext('isNativeMobile')
  if (category === SearchKind.TRACKS || isNativeMobile || isMobileWeb()) {
    // If we are on the tracks sub-page of search or mobile, which we should paginate on
    let results
    if (isTagSearch) {
      const { tracks } = yield* call(
        getTagSearchResults,
        trimToAlphaNumeric(query),
        category,
        limit,
        offset
      )
      results = tracks
    } else {
      const { tracks } = yield* call(
        getSearchResults,
        query,
        category,
        limit,
        offset
      )
      results = tracks
    }
    if (results) return results
    return []
  } else {
    // If we are part of the all results search page
    try {
      const trackIds = yield* select(getSearchResultsPageTracks)

      // getTracks returns an unsorted map of ID to track metadata.
      // We sort this object by trackIds, which is returned sorted by discprov.
      const [tracks, sortedIds] = yield* all([
        select(getTracks, { ids: trackIds }),
        select(getSearchResultsPageTracks)
      ])
      const sortedTracks = (sortedIds as number[]).map((id) => tracks[id])
      return sortedTracks
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
