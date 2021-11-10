import { call } from 'redux-saga/effects'

import { Track } from 'common/models/Track'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import { ID } from '../../common/models/Identifiers'
import { processAndCacheTracks } from '../../common/store/cache/tracks/utils'
import { Nullable } from '../../common/utils/typeUtils'
import AudiusBackend from '../../services/AudiusBackend'
import Explore from '../../services/audius-backend/Explore'

export function* getRecommendedTracks(
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
): Generator<any, Track[], any> {
  const tracks = yield apiClient.getRecommended({
    genre,
    exclusionList,
    currentUserId
  })
  yield call(processAndCacheTracks, tracks)
  return tracks as Track[]
}

export function* getLuckyTracks(limit: number): Generator<any, Track[], any> {
  const latestTrackID = yield call(Explore.getLatestTrackID)
  const ids = Array.from({ length: limit }, () =>
    Math.floor(Math.random() * latestTrackID)
  )
  const tracks = yield call(AudiusBackend.getAllTracks, {
    offset: 0,
    limit,
    idsArray: ids,
    filterDeletes: true
  })
  yield call(processAndCacheTracks, tracks)
  return tracks as Track[]
}
