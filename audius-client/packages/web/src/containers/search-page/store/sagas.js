import { call, takeLatest, put } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import { waitForBackendSetup } from 'store/backend/sagas'
import { fetchUsers } from 'store/cache/users/sagas'
import { trimToAlphaNumeric } from 'utils/formatUtil'

import { tracksActions as tracksLineupActions } from 'containers/search-page/store/lineups/tracks/actions'
import * as searchPageActions from 'containers/search-page/store/actions'
import tracksSagas from 'containers/search-page/store/lineups/tracks/sagas'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { processAndCacheCollections } from 'store/cache/collections/utils'

export function* getTagSearchResults(tag, kind, limit, offset) {
  const results = yield call(AudiusBackend.searchTags, {
    searchText: tag.toLowerCase(),
    minTagThreshold: 1,
    kind,
    limit,
    offset
  })
  const { users, tracks } = results

  const creatorIds = tracks
    .map(t => t.owner_id)
    .concat(users.map(u => u.user_id))

  yield call(fetchUsers, creatorIds)

  const { entries } = yield call(fetchUsers, creatorIds)

  const tracksWithUsers = tracks.map(track => ({
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
  const results = yield call(AudiusBackend.searchFull, {
    searchText,
    kind,
    limit,
    offset
  })
  const { tracks, albums, playlists, users } = results
  const creatorIds = tracks
    .map(t => t.owner_id)
    .concat(albums.map(a => a.playlist_owner_id))
    .concat(playlists.map(p => p.playlist_owner_id))
    .concat(users.map(u => u.user_id))

  const { entries } = yield call(fetchUsers, creatorIds)

  const tracksWithUsers = tracks.map(track => ({
    ...track,
    user: entries[track.owner_id]
  }))
  yield call(processAndCacheTracks, tracksWithUsers)

  const collectionsWithUsers = albums.concat(playlists).map(collection => ({
    ...collection,
    user: entries[collection.playlist_owner_id]
  }))
  yield call(processAndCacheCollections, collectionsWithUsers)

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
