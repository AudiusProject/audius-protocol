import { ID, UserTrack, Nullable, getContext } from '@audius/common'
import { call } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const apiClient = yield* getContext('apiClient')
  const tracks = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}

export function* getLuckyTracks(limit: number) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const explore = yield* getContext('explore')

  const latestTrackID = yield* call([explore, 'getLatestTrackID'])
  const ids = Array.from({ length: limit }, () =>
    Math.floor(Math.random() * latestTrackID)
  )

  const tracks: UserTrack[] = yield* call(audiusBackendInstance.getAllTracks, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}
