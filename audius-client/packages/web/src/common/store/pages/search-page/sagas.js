import {
  trimToAlphaNumeric,
  accountSelectors,
  searchResultsPageActions as searchPageActions,
  searchResultsPageTracksLineupActions as tracksLineupActions,
  waitForAccount,
  SearchKind
} from '@audius/common'
import { select, call, takeLatest, put, getContext } from 'redux-saga/effects'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import tracksSagas from 'common/store/pages/search-page/lineups/tracks/sagas'

const getUserId = accountSelectors.getUserId

export function* getTagSearchResults(tag, kind, limit, offset) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
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

export function* getSearchResults(searchText, kind, limit, offset) {
  const apiClient = yield getContext('apiClient')
  yield waitForAccount()
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
