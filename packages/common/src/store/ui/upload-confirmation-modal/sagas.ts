import { takeEvery } from 'redux-saga/effects'
import { put } from 'typed-redux-saga'

import { setVisibility } from '../modals/parentSlice'

import { open, OpenPayload, requestOpen } from './slice'

function* handleRequestOpen(action: OpenPayload) {
  const { payload } = action
  yield* put(open(payload))
  yield* put(setVisibility({ modal: 'UploadConfirmation', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
