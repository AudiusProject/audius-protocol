import { ID, Kind, StemCategory, Stem, StemTrackMetadata } from '@audius/common'
import { call, put } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { waitForValue } from 'utils/sagaHelpers'

import { getTrack } from '../selectors'

import { processAndCacheTracks } from './processAndCacheTracks'

/**
 * Fetches stems for a parent track.
 * Caches the stems as tracks, and updates the parent
 * track with a reference to the stems.
 *
 * @param trackId the parent track for which to fetch stems
 */
export function* fetchAndProcessStems(trackId: ID) {
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
