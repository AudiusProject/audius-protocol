import { takeEvery, put, select } from 'redux-saga/effects'

import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { AppState } from 'store/types'

import { setVisibility } from '../modals/slice'

import { open, requestOpen } from './slice'
import { RequestOpenAction } from './types'

function* handleRequestOpen(action: RequestOpenAction) {
  if (action.payload.type === 'track') {
    const { trackId, source, type } = action.payload

    const track: Track = yield select((state: AppState) =>
      getTrack(state, { id: trackId })
    )
    const artist: User = yield select((state: AppState) =>
      getUser(state, { id: track.owner_id })
    )
    yield put(open({ type, track, source, artist }))
  } else {
    const { profileId, source, type } = action.payload
    const profile: User = yield select((state: AppState) =>
      getUser(state, { id: profileId })
    )
    yield put(open({ type, profile, source }))
  }

  yield put(setVisibility({ modal: 'Share', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
