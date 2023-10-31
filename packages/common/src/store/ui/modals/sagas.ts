import { takeEvery, call } from 'typed-redux-saga'

import { Name } from 'models/Analytics'
import { getContext } from 'store/effects'

import {
  TRACK_CLOSED,
  TRACK_OPENED,
  trackModalClosed,
  trackModalOpened
} from './actions'

function* handleTrackModalOpened({
  reducerPath,
  trackingData
}: ReturnType<typeof trackModalOpened>) {
  const { track, make } = yield* getContext('analytics')
  yield* call(
    track,
    make({ eventName: Name.MODAL_OPENED, name: reducerPath, ...trackingData })
  )
}

function* handleTrackModalClosed({
  reducerPath
}: ReturnType<typeof trackModalClosed>) {
  const { track, make } = yield* getContext('analytics')
  yield* call(track, make({ eventName: Name.MODAL_CLOSED, name: reducerPath }))
}

function* watchTrackModalOpened() {
  yield takeEvery(TRACK_OPENED, handleTrackModalOpened)
}

function* watchTrackModalClosed() {
  yield takeEvery(TRACK_CLOSED, handleTrackModalClosed)
}

export function sagas() {
  return [watchTrackModalOpened, watchTrackModalClosed]
}
