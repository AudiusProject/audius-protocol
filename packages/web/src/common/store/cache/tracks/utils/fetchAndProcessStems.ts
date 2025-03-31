import {
  stemTrackMetadataFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Kind, StemCategory, ID, Stem } from '@audius/common/models'
import {
  cacheTracksSelectors,
  cacheActions,
  getSDK
} from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { Id } from '@audius/sdk'
import { call, put } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import { processAndCacheTracks } from './processAndCacheTracks'
const { getTrack } = cacheTracksSelectors

/**
 * Fetches stems for a parent track.
 * Caches the stems as tracks, and updates the parent
 * track with a reference to the stems.
 *
 * @param trackId the parent track for which to fetch stems
 */
export function* fetchAndProcessStems(trackId: ID) {
  yield* waitForRead()
  const sdk = yield* getSDK()

  const { data = [] } = yield* call(
    [sdk.full.tracks, sdk.full.tracks.getTrackStems],
    { trackId: Id.parse(trackId) }
  )

  const stems = transformAndCleanList(data, stemTrackMetadataFromSDK)

  if (stems.length) {
    yield* call(processAndCacheTracks, stems)
  }

  // Don't update the original track with stems until it's in the cache
  yield* call(waitForValue, getTrack, { id: trackId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map((s) => ({
    track_id: s.track_id,
    category: StemCategory[s.stem_of.category],
    orig_filename: s.orig_filename ?? ''
  }))

  if (stemsUpdate.length) {
    yield* put(
      cacheActions.update(Kind.TRACKS, [
        {
          id: trackId,
          metadata: {
            _stems: stemsUpdate
          }
        }
      ])
    )
  }
}
