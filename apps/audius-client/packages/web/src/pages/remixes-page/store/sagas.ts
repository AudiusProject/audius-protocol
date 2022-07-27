import { TrackMetadata } from '@audius/common'
import { takeEvery, call, put } from 'redux-saga/effects'

import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import {
  fetchTrack,
  fetchTrackSucceeded
} from 'common/store/pages/remixes/slice'
import { waitForBackendSetup } from 'store/backend/sagas'

import tracksSagas from './lineups/tracks/sagas'

function* watchFetch() {
  yield takeEvery(
    fetchTrack.type,
    function* (action: ReturnType<typeof fetchTrack>) {
      yield call(waitForBackendSetup)
      const { handle, slug } = action.payload

      const track: TrackMetadata = yield call(retrieveTrackByHandleAndSlug, {
        handle,
        slug
      })

      yield put(fetchTrackSucceeded({ trackId: track.track_id }))
    }
  )
}

export default function sagas() {
  return [...tracksSagas(), watchFetch]
}
