import { TimeRange, ID, Track, UserTrackMetadata } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  cacheTracksSelectors,
  trendingPageLineupSelectors,
  trendingPageActions,
  trendingPageSelectors,
  getContext
} from '@audius/common/store'
import { Genre, Nullable } from '@audius/common/utils'
import { keccak_256 } from 'js-sha3'
import { call, put, select } from 'redux-saga/effects'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { AppState } from 'store/types'
import { waitForRead } from 'utils/sagaHelpers'
const { getLastFetchedTrendingGenre, getTrendingGenre } = trendingPageSelectors
const { setLastFetchedTrendingGenre } = trendingPageActions
const { getTrendingEntries } = trendingPageLineupSelectors
const { getTracks } = cacheTracksSelectors

type RetrieveTrendingArgs = {
  timeRange: TimeRange
  genre: Nullable<Genre>
  offset: number
  limit: number
  currentUserId: Nullable<ID>
}

export function* retrieveTrending({
  timeRange,
  genre,
  offset,
  limit,
  currentUserId
}: RetrieveTrendingArgs): Generator<any, Track[], any> {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield call(remoteConfigInstance.waitForRemoteConfig)
  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TF)?.split(',') ?? []
  )

  const cachedTracks: ReturnType<ReturnType<typeof getTrendingEntries>> =
    yield select(getTrendingEntries(timeRange))

  const lastGenre = yield select(getLastFetchedTrendingGenre)
  yield put(setLastFetchedTrendingGenre(genre))

  const useCached = lastGenre === genre && cachedTracks.length > offset + limit

  if (useCached) {
    const trackIds = cachedTracks.slice(offset, limit + offset).map((t) => t.id)
    const tracksMap: ReturnType<typeof getTracks> = yield select(
      (state: AppState) => getTracks(state, { ids: trackIds })
    )
    const tracks = trackIds.map((id) => tracksMap[id])
    return tracks
  }

  let apiTracks: UserTrackMetadata[] = yield apiClient.getTrending({
    genre,
    offset,
    limit,
    currentUserId,
    timeRange
  })

  if (TF.size > 0) {
    apiTracks = apiTracks.filter((t) => {
      const shaId = keccak_256(t.track_id.toString())
      return !TF.has(shaId)
    })
  }

  const currentGenre = yield select(getTrendingGenre)

  // If we changed genres, do nothing
  if (currentGenre !== genre) return []

  const processed: Track[] = yield processAndCacheTracks(apiTracks)
  return processed
}
