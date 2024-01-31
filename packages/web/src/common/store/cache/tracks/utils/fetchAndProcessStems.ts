import {
  Kind,
  StemCategory,
  ID,
  Stem,
  StemTrackMetadata
} from '@audius/common/models'
import {
  cacheTracksSelectors,
  cacheActions,
  getContext
} from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { call, put } from 'redux-saga/effects'

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
  const apiClient = yield* getContext('apiClient')

  const stems: StemTrackMetadata[] = yield call(
    (args) => apiClient.getStems(args),
    {
      trackId
    }
  )

  if (stems.length) {
    yield call(processAndCacheTracks, stems)
  }

  // Don't update the original track with stems until it's in the cache
  yield call(waitForValue, getTrack, { id: trackId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map((s) => ({
    track_id: s.track_id,
    category: StemCategory[s.stem_of.category]
  }))

  yield put(
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
