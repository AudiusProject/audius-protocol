import { takeEvery, put, select } from 'redux-saga/effects'

import { Track } from 'common/models/Track'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { AppState } from 'store/types'

import { setVisibility } from '../modals/slice'

import { open, requestOpen } from './slice'
import { RequestOpenAction } from './types'

function* handleRequestOpen(action: RequestOpenAction) {
  const { trackId, source } = action.payload

  const track: Track = yield select((state: AppState) =>
    getTrack(state, { id: trackId })
  )

  yield put(open({ track, source }))
  yield put(setVisibility({ modal: 'Share', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
