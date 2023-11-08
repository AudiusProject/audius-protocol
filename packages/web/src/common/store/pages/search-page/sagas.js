import {
  trimToAlphaNumeric,
  searchResultsPageActions as searchPageActions,
  searchResultsPageTracksLineupActions as tracksLineupActions,
  SearchKind
} from '@audius/common'
import { call, takeLatest, put } from 'redux-saga/effects'

import tracksSagas, {
  getSearchResults,
  getTagSearchResults
} from 'common/store/pages/search-page/lineups/tracks/sagas'
import { waitForRead } from 'utils/sagaHelpers'

export function* fetchSearchPageTags(action) {
  yield call(waitForRead)
  const query = trimToAlphaNumeric(action.tag)

  const rawResults = yield call(
    getTagSearchResults,
    query,
    action.kind,
    action.limit,
    action.offset
  )
  if (rawResults) {
    const results = {
      users:
        action.searchKind === SearchKind.USERS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.users.map(({ user_id: id }) => id)
          : undefined,
      tracks:
        action.searchKind === SearchKind.TRACKS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.tracks.map(({ track_id: id }) => id)
          : undefined
    }
    yield put(
      searchPageActions.fetchSearchPageTagsSucceeded(results, action.tag)
    )
    if (
      action.searchKind === SearchKind.TRACKS ||
      action.searchKind === SearchKind.ALL
    ) {
      yield put(
        tracksLineupActions.fetchLineupMetadatas(0, 10, false, {
          category: action.kind,
          query,
          isTagSearch: true
        })
      )
    }
  } else {
    yield put(searchPageActions.fetchSearchPageTagsFailed())
  }
}

function* fetchSearchPageResults(action) {
  yield call(waitForRead)

  const rawResults = yield call(
    getSearchResults,
    action.searchText,
    action.searchKind,
    action.limit,
    action.offset
  )
  if (rawResults) {
    const results = {
      users:
        action.searchKind === SearchKind.USERS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.users.map(({ user_id: id }) => id)
          : undefined,
      tracks:
        action.searchKind === SearchKind.TRACKS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.tracks.map(({ track_id: id }) => id)
          : undefined,
      albums:
        action.searchKind === SearchKind.ALBUMS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.albums.map(({ playlist_id: id }) => id)
          : undefined,
      playlists:
        action.searchKind === SearchKind.PLAYLISTS ||
        action.searchKind === SearchKind.ALL
          ? rawResults.playlists.map(({ playlist_id: id }) => id)
          : undefined
    }
    yield put(
      searchPageActions.fetchSearchPageResultsSucceeded(
        results,
        action.searchText
      )
    )
    if (
      action.searchKind === SearchKind.TRACKS ||
      action.searchKind === SearchKind.ALL
    ) {
      yield put(
        tracksLineupActions.fetchLineupMetadatas(0, 10, false, {
          category: action.searchKind,
          query: action.searchText,
          isTagSearch: false
        })
      )
    }
  } else {
    yield put(searchPageActions.fetchSearchPageResultsFailed())
  }
}

function* watchFetchSearchPageTags() {
  yield takeLatest(
    searchPageActions.FETCH_SEARCH_PAGE_TAGS,
    fetchSearchPageTags
  )
}

function* watchFetchSearchPageResults() {
  yield takeLatest(
    searchPageActions.FETCH_SEARCH_PAGE_RESULTS,
    fetchSearchPageResults
  )
}

export default function sagas() {
  return [
    ...tracksSagas(),
    watchFetchSearchPageResults,
    watchFetchSearchPageTags
  ]
}
