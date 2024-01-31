import {
  accountSelectors,
  processAndCacheUsers,
  searchResultsPageTracksLineupActions as tracksLineupActions,
  searchResultsPageActions as searchPageActions,
  SearchKind
} from '@audius/common/store'

import { FeatureFlags } from '@audius/common/services'
import { trimToAlphaNumeric, removeNullable } from '@audius/common/utils'
import { flatMap, zip } from 'lodash'
import {
  select,
  call,
  takeLatest,
  put,
  getContext,
  all
} from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import tracksSagas from 'common/store/pages/search-page/lineups/tracks/sagas'
import { waitForRead } from 'utils/sagaHelpers'

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

const searchMultiMap = {
  grimes: ['grimez', 'grimes']
}

export function* getSearchResults(searchText, kind, limit, offset) {
  yield waitForRead()
  const getFeatureEnabled = yield getContext('getFeatureEnabled')
  const isUSDCEnabled = yield call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )

  const apiClient = yield getContext('apiClient')
  const userId = yield select(getUserId)
  let results
  if (searchText in searchMultiMap) {
    const searches = searchMultiMap[searchText].map((query) =>
      call([apiClient, 'getSearchFull'], {
        currentUserId: userId,
        query,
        kind,
        limit,
        offset,
        includePurchaseable: isUSDCEnabled
      })
    )
    const allSearchResults = yield all(searches)
    results = allSearchResults.reduce(
      (acc, cur) => {
        acc.tracks = flatMap(zip(acc.tracks, cur.tracks)).filter(removeNullable)
        acc.users = flatMap(zip(acc.users, cur.users)).filter(removeNullable)
        acc.albums = flatMap(zip(acc.albums, cur.albums)).filter(removeNullable)
        acc.playlists = flatMap(zip(acc.playlists, cur.playlists)).filter(
          removeNullable
        )
        return acc
      },
      { tracks: [], albums: [], playlists: [], users: [] }
    )
  } else {
    results = yield call([apiClient, 'getSearchFull'], {
      currentUserId: userId,
      query: searchText,
      kind,
      limit,
      offset,
      includePurchaseable: isUSDCEnabled
    })
  }
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
