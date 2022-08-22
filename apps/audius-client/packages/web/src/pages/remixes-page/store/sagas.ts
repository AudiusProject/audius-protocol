import { TrackMetadata, remixesPageActions } from '@audius/common'
import { takeEvery, call, put } from 'redux-saga/effects'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { retrieveTrackByHandleAndSlug } from 'common/store/cache/tracks/utils/retrieveTracks'

import tracksSagas from './lineups/tracks/sagas'
const { fetchTrack, fetchTrackSucceeded } = remixesPageActions

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
