import { takeEvery, call, put } from 'redux-saga/effects'

import { TrackMetadata } from 'models/Track'
import { waitForBackendSetup } from 'store/backend/sagas'
import { retrieveTrackByHandleAndSlug } from 'store/cache/tracks/utils/retrieveTracks'

import tracksSagas from './lineups/tracks/sagas'
import { fetchTrack, fetchTrackSucceeded } from './slice'

function* watchFetch() {
  yield takeEvery(fetchTrack.type, function* (
    action: ReturnType<typeof fetchTrack>
  ) {
    yield call(waitForBackendSetup)
    const { handle, slug } = action.payload

    const track: TrackMetadata = yield call(retrieveTrackByHandleAndSlug, {
      handle,
      slug
    })

    yield put(fetchTrackSucceeded({ trackId: track.track_id }))
  })
}

export default function sagas() {
  return [...tracksSagas(), watchFetch]
}
