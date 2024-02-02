import { takeEvery, call } from 'typed-redux-saga'

import { Name } from '~/models/Analytics'
import { getContext } from '~/store/effects'

import { actions } from './parentSlice'
const { trackModalOpened, trackModalClosed } = actions

function* handleTrackModalOpened({
  payload: { name, source, trackingData }
}: ReturnType<typeof trackModalOpened>) {
  const { track, make } = yield* getContext('analytics')
  yield* call(
    track,
    make({ eventName: Name.MODAL_OPENED, source, name, ...trackingData })
  )
}

function* handleTrackModalClosed({
  payload: { name }
}: ReturnType<typeof trackModalClosed>) {
  const { track, make } = yield* getContext('analytics')
  yield* call(track, make({ eventName: Name.MODAL_CLOSED, name }))
}

function* watchTrackModalOpened() {
  yield takeEvery(trackModalOpened, handleTrackModalOpened)
}

function* watchTrackModalClosed() {
  yield takeEvery(trackModalClosed, handleTrackModalClosed)
}

export function sagas() {
  return [watchTrackModalOpened, watchTrackModalClosed]
}
