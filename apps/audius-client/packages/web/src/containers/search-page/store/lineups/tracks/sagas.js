import { select, all, call } from 'redux-saga/effects'

import { getTracks } from 'common/store/cache/tracks/selectors'
import {
  getCategory,
  getQuery,
  isTagSearch,
  getSearchTag
} from 'containers/search-page/helpers'
import {
  getSearchResults,
  getTagSearchResults
} from 'containers/search-page/store/sagas'
import { getSearchResultsPageTracks } from 'containers/search-page/store/selectors'
import { SearchKind } from 'containers/search-page/store/types'
import { LineupSagas } from 'store/lineup/sagas'
import { isMobile } from 'utils/clientUtil'

import { PREFIX, tracksActions } from './actions'

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
      const sortedTracks = sortedIds.map(id => tracks[id])

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
      PREFIX,
      tracksActions,
      state => state.search.tracks,
      getSearchPageResultsTracks
    )
  }
}

export default function sagas() {
  return new SearchPageResultsSagas().getSagas()
}
