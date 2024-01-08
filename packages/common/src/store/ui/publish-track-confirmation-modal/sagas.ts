import { takeEvery } from 'redux-saga/effects'
import { put } from 'typed-redux-saga'

import { setVisibility } from '../modals/parentSlice'

import { open, OpenPayload, requestOpen } from './slice'

function* handleRequestOpen(action: OpenPayload) {
  console.log('asdf handle request open: ', action)
  const { payload } = action
  yield* put(open(payload))
  yield* put(
    setVisibility({ modal: 'PublishTrackConfirmation', visible: true })
  )
}

function* watchHandleRequestOpen() {
  console.log('asdf watch handle')
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
