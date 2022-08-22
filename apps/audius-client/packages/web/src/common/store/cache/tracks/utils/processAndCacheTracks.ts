import {
  Kind,
  Track,
  TrackMetadata,
  makeUid,
  cacheActions,
  getContext
} from '@audius/common'
import { put, call } from 'typed-redux-saga'

import { addUsersFromTracks } from './helpers'
import { reformat } from './reformat'

/**
 * Processes tracks, adding users and calling `reformat`, before
 * caching the tracks.
 */
export function* processAndCacheTracks<T extends TrackMetadata>(
  tracks: T[]
): Generator<any, Track[], any> {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // Add users
  yield* call(addUsersFromTracks, tracks)

  // Remove users, add images
  const reformattedTracks = tracks.map((track) =>
    reformat(track, audiusBackendInstance)
  )

  // insert tracks into cache
  yield* put(
    cacheActions.add(
      Kind.TRACKS,
      reformattedTracks.map((t) => ({
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
