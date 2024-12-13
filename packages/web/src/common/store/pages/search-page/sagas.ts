import { searchResultsFromSDK } from '@audius/common/adapters'
import { OptionalId } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  processAndCacheUsers,
  searchResultsPageTracksLineupActions as tracksLineupActions,
  searchResultsPageActions as searchPageActions,
  SearchKind,
  getContext,
  SearchSortMethod,
  getSDK
} from '@audius/common/store'
import {
  Genre,
  formatMusicalKey,
  trimToAlphaNumeric
} from '@audius/common/utils'
import { Mood } from '@audius/sdk'
import { select, call, takeLatest, put } from 'typed-redux-saga'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import tracksSagas from 'common/store/pages/search-page/lineups/tracks/sagas'
import { waitForRead } from 'utils/sagaHelpers'

const getUserId = accountSelectors.getUserId

const getMinMaxFromBpm = (bpm?: string) => {
  const bpmParts = bpm ? bpm.split('-') : [undefined, undefined]
  const bpmMin = bpmParts[0] ? parseFloat(bpmParts[0]) : undefined
  const bpmMax = bpmParts[1] ? parseFloat(bpmParts[1]) : bpmMin
  return [bpmMin, bpmMax]
}

export function* getTagSearchResults(
  tag: string,
  kind: SearchKind,
  limit: number,
  offset: number,
  genre?: Genre,
  mood?: Mood,
  bpm?: string,
  key?: string,
  isVerified?: boolean,
  hasDownloads?: boolean,
  isPremium?: boolean,
  sortMethod?: SearchSortMethod
) {
  yield* waitForRead()
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isUSDCEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )

  const sdk = yield* getSDK()
  const userId = yield* select(getUserId)
  const [bpmMin, bpmMax] = getMinMaxFromBpm(bpm)
  const formattedKey = formatMusicalKey(key)

  const { data } = yield* call([sdk.full.search, sdk.full.search.searchTags], {
    bpmMax,
    bpmMin,
    hasDownloads,
    includePurchaseable: isUSDCEnabled,
    isPurchaseable: isPremium,
    isVerified,
    kind,
    limit,
    offset,
    query: tag.toLowerCase(),
    sortMethod,
    userId: OptionalId.parse(userId),
    genre: genre ? [genre] : undefined,
    mood: mood ? [mood] : undefined,
    key: formattedKey ? [formattedKey] : undefined
  })
  const { tracks, albums, playlists, users } = searchResultsFromSDK(data)

  yield* call(processAndCacheUsers, users)
  yield* call(processAndCacheTracks, tracks)

  const collections = albums.concat(playlists)
  yield* call(
    processAndCacheCollections,
    collections,
    /* shouldRetrieveTracks */ false
  )

  return { users, tracks, albums, playlists }
}

export function* fetchSearchPageTags(
  action: searchPageActions.FetchSearchPageTagsAction
) {
  yield* call(waitForRead)
  const query = trimToAlphaNumeric(action.tag)

  const rawResults = yield* call(
    getTagSearchResults,
    query,
    action.searchKind,
    action.limit,
    action.offset,
    action.genre,
    action.mood,
    action.bpm,
    action.key,
    action.isVerified,
    action.hasDownloads,
    action.isPremium,
    action.sortMethod
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
    yield* put(
      searchPageActions.fetchSearchPageTagsSucceeded({
        results,
        tag: action.tag
      })
    )
    if (
      action.searchKind === SearchKind.TRACKS ||
      action.searchKind === SearchKind.ALL
    ) {
      yield* put(
        tracksLineupActions.fetchLineupMetadatas(0, 10, false, {
          category: action.searchKind,
          query,
          isTagSearch: true
        })
      )
    }
  } else {
    yield* put(searchPageActions.fetchSearchPageTagsFailed())
  }
}

type GetSearchResultsArgs = {
  searchText: string
  kind: SearchKind
  limit: number
  offset: number
  genre?: Genre
  mood?: Mood
  bpm?: string
  key?: string
  isVerified?: boolean
  hasDownloads?: boolean
  isPremium?: boolean
  sortMethod?: SearchSortMethod
}

export function* getSearchResults({
  searchText,
  kind,
  limit,
  offset,
  genre,
  mood,
  bpm,
  key,
  isVerified,
  hasDownloads,
  isPremium,
  sortMethod
}: GetSearchResultsArgs) {
  yield* waitForRead()
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isUSDCEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )

  const sdk = yield* getSDK()
  const userId = yield* select(getUserId)
  const [bpmMin, bpmMax] = getMinMaxFromBpm(bpm)
  const formattedKey = formatMusicalKey(key)

  const { data } = yield* call([sdk.full.search, sdk.full.search.search], {
    bpmMax,
    bpmMin,
    hasDownloads,
    includePurchaseable: isUSDCEnabled,
    isPurchaseable: isPremium,
    isVerified,
    kind,
    limit,
    offset,
    query: searchText,
    sortMethod,
    userId: OptionalId.parse(userId),
    genre: genre ? [genre] : undefined,
    mood: mood ? [mood] : undefined,
    key: formattedKey ? [formattedKey] : undefined
  })
  const { tracks, albums, playlists, users } = searchResultsFromSDK(data)

  yield* call(processAndCacheUsers, users)
  yield* call(processAndCacheTracks, tracks)

  const collections = albums.concat(playlists)
  yield* call(
    processAndCacheCollections,
    collections,
    /* shouldRetrieveTracks */ false
  )

  return { users, tracks, albums, playlists }
}

function* fetchSearchPageResults(
  action: searchPageActions.FetchSearchPageResultsAction
) {
  yield* call(waitForRead)

  const { type: ignoredType, ...params } = action
  const rawResults = yield* call(getSearchResults, params)
  if (rawResults) {
    const results = {
      users:
        action.kind === SearchKind.USERS || action.kind === SearchKind.ALL
          ? rawResults.users.map(({ user_id: id }) => id)
          : undefined,
      tracks:
        action.kind === SearchKind.TRACKS || action.kind === SearchKind.ALL
          ? rawResults.tracks.map(({ track_id: id }) => id)
          : undefined,
      albums:
        action.kind === SearchKind.ALBUMS || action.kind === SearchKind.ALL
          ? rawResults.albums.map(({ playlist_id: id }) => id)
          : undefined,
      playlists:
        action.kind === SearchKind.PLAYLISTS || action.kind === SearchKind.ALL
          ? rawResults.playlists.map(({ playlist_id: id }) => id)
          : undefined
    }
    yield* put(
      searchPageActions.fetchSearchPageResultsSucceeded({
        results,
        searchText: action.searchText
      })
    )
    if (action.kind === SearchKind.TRACKS || action.kind === SearchKind.ALL) {
      yield* put(
        tracksLineupActions.fetchLineupMetadatas(0, 10, false, {
          category: action.kind,
          query: action.searchText,
          isTagSearch: false
        })
      )
    }
  } else {
    yield* put(searchPageActions.fetchSearchPageResultsFailed())
  }
}

function* watchFetchSearchPageTags() {
  yield* takeLatest(
    searchPageActions.FETCH_SEARCH_PAGE_TAGS,
    fetchSearchPageTags
  )
}

function* watchFetchSearchPageResults() {
  yield* takeLatest(
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
