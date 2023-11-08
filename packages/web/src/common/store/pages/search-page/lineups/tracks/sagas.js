import {
  accountSelectors,
  cacheTracksSelectors,
  searchResultsPageSelectors,
  SearchKind,
  searchResultsPageTracksLineupActions as tracksActions,
  processAndCacheUsers,
  removeNullable,
  FeatureFlags,
  trimToAlphaNumeric
} from '@audius/common'
import { flatMap, zip } from 'lodash'
import { select, all, call, getContext } from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { LineupSagas } from 'common/store/lineup/sagas'
import { isMobileWeb } from 'common/utils/isMobileWeb'

const searchMultiMap = {
  grimes: ['grimez', 'grimes']
}

const { getSearchTracksLineup, getSearchResultsPageTracks } =
  searchResultsPageSelectors
const { getTracks } = cacheTracksSelectors

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

function* getSearchPageResultsTracks({
  offset,
  limit,
  payload: { category, query, isTagSearch }
}) {
  const isNativeMobile = yield getContext('isNativeMobile')
  if (category === SearchKind.TRACKS || isNativeMobile || isMobileWeb()) {
    // If we are on the tracks sub-page of search or mobile, which we should paginate on
    let results
    if (isTagSearch) {
      const { tracks } = yield call(
        getTagSearchResults,
        trimToAlphaNumeric(query),
        category,
        limit,
        offset
      )
      results = tracks
    } else {
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
