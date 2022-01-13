import { takeEvery, call, put } from 'redux-saga/effects'

import { TrackMetadata } from 'common/models/Track'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'
import { waitForBackendSetup } from 'store/backend/sagas'

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
