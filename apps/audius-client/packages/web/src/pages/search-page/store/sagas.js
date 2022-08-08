import { select, call, takeLatest, put } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import * as searchPageActions from 'common/store/pages/search-results/actions'
import { tracksActions as tracksLineupActions } from 'common/store/pages/search-results/lineup/tracks/actions'
import { trimToAlphaNumeric } from 'common/utils/formatUtil'
import tracksSagas from 'pages/search-page/store/lineups/tracks/sagas'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { waitForBackendSetup } from 'store/backend/sagas'

export function* getTagSearchResults(tag, kind, limit, offset) {
  const results = yield call(audiusBackendInstance.searchTags, {
    query: tag.toLowerCase(),
    userTagCount: 1,
    kind,
    limit,
    offset
  })
  const { users, tracks } = results

  const creatorIds = tracks
    .map((t) => t.owner_id)
    .concat(users.map((u) => u.user_id))

  yield call(fetchUsers, creatorIds)

  const { entries } = yield call(fetchUsers, creatorIds)

  const tracksWithUsers = tracks.map((track) => ({
    ...track,
    user: entries[track.owner_id]
  }))
  yield call(processAndCacheTracks, tracksWithUsers)

  return { users, tracks }
}

export function* fetchSearchPageTags(action) {
  yield call(waitForBackendSetup)
  const tag = trimToAlphaNumeric(action.tag)

  const results = yield call(
    getTagSearchResults,
    tag,
    action.kind,
    action.limit,
    action.offset
  )
  if (results) {
    results.users = results.users.map(({ user_id: id }) => id)
    results.tracks = results.tracks.map(({ track_id: id }) => id)
    yield put(searchPageActions.fetchSearchPageTagsSucceeded(results, tag))
    yield put(tracksLineupActions.fetchLineupMetadatas(0, 10))
  } else {
    yield put(searchPageActions.fetchSearchPageTagsFailed())
  }
}

export function* getSearchResults(searchText, kind, limit, offset) {
  const userId = yield select(getUserId)
  const results = yield apiClient.getSearchFull({
    currentUserId: userId,
    query: searchText,
    kind,
    limit,
    offset
  })
  const { tracks, albums, playlists, users } = results

  yield call(processAndCacheUsers, users)
  yield call(processAndCacheTracks, tracks)

  const collections = albums.concat(playlists)
  yield call(
    processAndCacheCollections,
    collections,
    /* shouldRetrieveTracks */ false
  )

  return { users, tracks, albums, playlists }
}

function* fetchSearchPageResults(action) {
  yield call(waitForBackendSetup)

  const results = yield call(
    getSearchResults,
    action.searchText,
    action.searchKind,
    action.limit,
    action.offset
  )
  if (results) {
    results.users = results.users.map(({ user_id: id }) => id)
    results.tracks = results.tracks.map(({ track_id: id }) => id)
    results.albums = results.albums.map(({ playlist_id: id }) => id)
    results.playlists = results.playlists.map(({ playlist_id: id }) => id)
    yield put(
      searchPageActions.fetchSearchPageResultsSucceeded(
        results,
        action.searchText
      )
    )
    yield put(tracksLineupActions.fetchLineupMetadatas(0, 10))
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
