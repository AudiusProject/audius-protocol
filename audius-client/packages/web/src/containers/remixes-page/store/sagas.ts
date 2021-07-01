import { takeEvery, call, put } from 'redux-saga/effects'

import { waitForBackendSetup } from 'store/backend/sagas'
import { retrieveTracks } from 'store/cache/tracks/utils'

import tracksSagas from './lineups/tracks/sagas'
import { fetchTrack, fetchTrackSucceeded } from './slice'

function* watchFetch() {
  yield takeEvery(fetchTrack.type, function* (
    action: ReturnType<typeof fetchTrack>
  ) {
    yield call(waitForBackendSetup)
    const { trackId } = action.payload

    yield call(retrieveTracks, { trackIds: [trackId] })

    yield put(fetchTrackSucceeded({ trackId }))
  })
}

export default function sagas() {
  return [...tracksSagas(), watchFetch]
}
