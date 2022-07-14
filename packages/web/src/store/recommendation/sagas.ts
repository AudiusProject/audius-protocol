import { ID } from '@audius/common'
import { call } from 'typed-redux-saga'

import { UserTrack } from 'common/models/Track'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { Nullable } from 'common/utils/typeUtils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import AudiusBackend from '../../services/AudiusBackend'
import Explore from '../../services/audius-backend/Explore'

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
  const tracks: UserTrack[] = yield* call(AudiusBackend.getAllTracks, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield* call(processAndCacheTracks, tracks)
  return tracks
}
