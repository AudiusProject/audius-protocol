import { delay, takeEvery, put } from 'redux-saga/effects'

import { openWithDelay, setVisibility } from './slice'

function* watchOpenWithDelay() {
  yield takeEvery(
    openWithDelay.type,
    function* (action: ReturnType<typeof openWithDelay>) {
      yield delay(action.payload.delay)
      yield put(setVisibility({ isOpen: true }))
    }
  )
}

export default function sagas() {
  return [watchOpenWithDelay]
}
