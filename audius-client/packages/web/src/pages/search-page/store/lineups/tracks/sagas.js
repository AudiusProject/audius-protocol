import {
  cacheTracksSelectors,
  searchResultsPageSelectors,
  SearchKind,
  searchResultsPageTracksLineupActions as tracksActions
} from '@audius/common'
import { select, all, call } from 'redux-saga/effects'

import { LineupSagas } from 'common/store/lineup/sagas'
import {
  getCategory,
  getQuery,
  isTagSearch,
  getSearchTag
} from 'pages/search-page/helpers'
import {
  getSearchResults,
  getTagSearchResults
} from 'pages/search-page/store/sagas'
import { isMobile } from 'utils/clientUtil'
const { getSearchTracksLineup, getSearchResultsPageTracks } =
  searchResultsPageSelectors
const { getTracks } = cacheTracksSelectors

function* getSearchPageResultsTracks({ offset, limit, payload }) {
  const category = getCategory()

  if (category === SearchKind.TRACKS || isMobile()) {
    // If we are on the tracks sub-page of search or mobile, which we should paginate on
    let results
    if (isTagSearch()) {
      const tag = getSearchTag()
      const { tracks } = yield call(
        getTagSearchResults,
        tag,
        category,
        limit,
        offset
      )
      results = tracks
    } else {
      const query = getQuery()
      const { tracks } = yield call(
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
      const trackIds = yield select(getSearchResultsPageTracks)

      // getTracks returns an unsorted map of ID to track metadata.
      // We sort this object by trackIds, which is returned sorted by discprov.
      const [tracks, sortedIds] = yield all([
        select(getTracks, { ids: trackIds }),
        select(getSearchResultsPageTracks)
      ])
      const sortedTracks = sortedIds.map((id) => tracks[id])
      return sortedTracks
    } catch (e) {
      console.error(e)
      return []
    }
  }
}

class SearchPageResultsSagas extends LineupSagas {
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
