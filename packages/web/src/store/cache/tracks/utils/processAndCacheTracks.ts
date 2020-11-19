import { put, call } from 'redux-saga/effects'
import * as cacheActions from 'store/cache/actions'
import { reformat } from './reformat'
import { Kind } from 'store/types'
import { makeUid } from 'utils/uid'
import { addUsersFromTracks } from './helpers'
import Track, { TrackMetadata } from 'models/Track'
import { setTracksIsBlocked } from './blocklist'

/**
 * Processes tracks, adding users and calling `reformat`, before
 * caching the tracks.
 * @param tracks
 */
export function* processAndCacheTracks<T extends TrackMetadata>(
  tracks: T[]
): Generator<any, Track[], any> {
  // Add users
  yield addUsersFromTracks(tracks)

  const checkedTracks: T[] = yield call(setTracksIsBlocked, tracks)

  // Remove users, add images
  const reformattedTracks = checkedTracks.map(reformat)

  // insert tracks into cache
  yield put(
    cacheActions.add(
      Kind.TRACKS,
      reformattedTracks.map(t => ({
        id: t.track_id,
        uid: makeUid(Kind.TRACKS, t.track_id),
        metadata: t
      })),
      false,
      true
    )
  )

  return reformattedTracks
}
