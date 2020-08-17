import { call, put } from 'redux-saga/effects'
import { ID } from 'models/common/Identifiers'
import { Kind } from 'store/types'
import AudiusBackend from 'services/AudiusBackend'
import { StemUserTrack, Stem } from 'models/Track'
import { waitForValue } from 'utils/sagaHelpers'
import { getTrack } from '../selectors'
import * as cacheActions from 'store/cache/actions'
import { StemCategory } from 'models/Stems'
import { processAndCacheTracks } from './processAndCacheTracks'

/**
 * Fetches stems for a parent track.
 * Caches the stems as tracks, and updates the parent
 * track with a reference to the stems.
 *
 * @param trackId the parent track for which to fetch stems
 */
export function* fetchAndProcessStems(trackId: ID) {
  const stems: Array<StemUserTrack> = yield call(AudiusBackend.getStems, {
    trackId
  })

  if (stems.length) {
    yield call(processAndCacheTracks, stems)
  }

  // Don't update the original track with stems until it's in the cache
  yield call(waitForValue, getTrack, { id: trackId })

  // Create the update
  const stemsUpdate: Stem[] = stems.map(s => ({
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
