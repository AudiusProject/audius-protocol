import { ID, UserTrack, Nullable } from '@audius/common'
import { call } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import Explore from 'services/audius-backend/Explore'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) {
  const tracks = yield* call([apiClient, apiClient.getRecommended], {
    genre,
    exclusionList,
    currentUserId
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}

export function* getLuckyTracks(limit: number) {
  const latestTrackID = yield* call(Explore.getLatestTrackID)
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
