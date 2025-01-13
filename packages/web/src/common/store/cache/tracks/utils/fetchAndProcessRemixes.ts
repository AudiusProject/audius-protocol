import {
  transformAndCleanList,
  userTrackMetadataFromSDK
} from '@audius/common/adapters'
import { Kind, ID } from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksSelectors,
  cacheActions,
  getSDK
} from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { Id, OptionalId } from '@audius/sdk'
import { select, call, put } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import { processAndCacheTracks } from './processAndCacheTracks'
const { getTrack } = cacheTracksSelectors
const getUserId = accountSelectors.getUserId

const INITIAL_FETCH_LIMIT = 6

/**
 * Fetches remixes for a parent track.
 * Caches the remixes as tracks, and updates the parent
 * track with a reference to the remixes.
 *
 * @param trackId the parent track for which to fetch remixes
 */
export function* fetchAndProcessRemixes(trackId: ID) {
  yield* waitForRead()

  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

  const { data } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getTrackRemixes],
    {
      trackId: Id.parse(trackId),
      offset: 0,
      limit: INITIAL_FETCH_LIMIT,
      userId: OptionalId.parse(currentUserId)
    }
  )

  if (!data) return

  const { count, tracks } = data
  const remixes = transformAndCleanList(tracks, userTrackMetadataFromSDK)

  if (remixes.length) {
    yield* call(processAndCacheTracks, remixes)
  }

  // Create the update
  // Note: This update is made eagerly (potentially before the parent track is cached).
  // This is OK because the cache action will not overwrite this data, and it's important
  // that we can recognize ASAP that the track has remixes.
  // The track will still go through it's normal lifecycle of status (loading => success/error)
  // and the availability of these fields give a hint to the skeleton layout.
  const remixesUpdate = remixes.map((r) => ({
    track_id: r.track_id
  }))

  yield* put(
    cacheActions.update(Kind.TRACKS, [
      {
        id: trackId,
        metadata: {
          _remixes: remixesUpdate,
          _remixes_count: count
        }
      }
    ])
  )
}

/**
 * Fetches parents for a remixed track.
 * Caches the parents as tracks, and updates the remixed track
 * with a reference to the parent.
 *
 * @param trackId the track for which to fetch remix parents
 */
export function* fetchAndProcessRemixParents(trackId: ID) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

  const { data = [] } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getTrackRemixParents],
    {
      trackId: Id.parse(trackId),
      offset: 0,
      limit: 1,
      userId: OptionalId.parse(currentUserId)
    }
  )
  const remixParents = transformAndCleanList(data, userTrackMetadataFromSDK)

  if (!remixParents) return

  if (remixParents.length) {
    yield* call(processAndCacheTracks, remixParents)
  }

  // Don't update the original track with parents until it's in the cache
  yield* call(waitForValue, getTrack, { id: trackId })

  // Create the update
  const remixParentsUpdate = remixParents.map((s) => ({
    track_id: s.track_id
  }))

  yield* put(
    cacheActions.update(Kind.TRACKS, [
      {
        id: trackId,
        metadata: {
          _remix_parents: remixParentsUpdate
        }
      }
    ])
  )
}
