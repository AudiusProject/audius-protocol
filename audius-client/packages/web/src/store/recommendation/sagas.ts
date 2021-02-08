import Track from '../../models/Track'
import { call } from 'redux-saga/effects'
import Explore from '../../services/audius-backend/Explore'
import AudiusBackend from '../../services/AudiusBackend'
import { processAndCacheTracks } from '../cache/tracks/utils'

export function* fetchRandomTracks(
  limit: number
): Generator<any, Track[], any> {
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
