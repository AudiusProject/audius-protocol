import { remixesPageActions } from '@audius/common/store'

import { TrackMetadata, Track } from '@audius/common/models'
import { takeEvery, call, put } from 'redux-saga/effects'

import {
  retrieveTrackByHandleAndSlug,
  retrieveTracks
} from 'common/store/cache/tracks/utils/retrieveTracks'
import { waitForRead } from 'utils/sagaHelpers'

import tracksSagas from './lineups/tracks/sagas'

const { fetchTrack, fetchTrackSucceeded } = remixesPageActions

function* watchFetch() {
  yield takeEvery(
    fetchTrack.type,
    function* (action: ReturnType<typeof fetchTrack>) {
      yield call(waitForRead)
      const { handle, slug, id } = action.payload
      if (!id && (!handle || !slug)) {
        throw new Error(
          'Programming error - fetch tracks action for remixes page requires either `id` or both `handle` and `slug` params in the payload.'
        )
      }
      let track: TrackMetadata | Track
      if (id) {
        // @ts-ignore - TS complains about the generator lacking a return type annotation
        const res = yield call(retrieveTracks, { trackIds: [id] })
        track = res[0]
      } else {
        if (!handle || !slug) return // This line not needed, but is here to appease typescript
        track = yield call(retrieveTrackByHandleAndSlug, {
          handle,
          slug
        })
      }

      // TODO: The track could potentially be null or undefined - should have a way to deal with that.
      yield put(fetchTrackSucceeded({ trackId: track.track_id }))
    }
  )
}

export default function sagas() {
  return [...tracksSagas(), watchFetch]
}
