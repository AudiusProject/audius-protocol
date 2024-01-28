import { getContext } from '@audius/common'
import { omit } from 'lodash'
import { takeEvery, call } from 'redux-saga/effects'

import {
  TRACK,
  IDENTIFY,
  TrackEvent,
  IdentifyEvent
} from 'common/store/analytics/actions'

function* trackEventAsync(action: TrackEvent) {
  const analytics = yield* getContext('analytics')
  const { callback, eventName, ...properties } = action
  yield call(
    analytics.track,
    {
      eventName,
      properties: omit(properties, 'type')
    },
    callback
  )
}

function* identifyEventAsync(action: IdentifyEvent) {
  const analytics = yield* getContext('analytics')
  yield call(analytics.identify, action.handle, action.traits)
}

function* watchTrackEvent() {
  yield takeEvery(TRACK, trackEventAsync)
}

function* watchIdentifyEvent() {
  yield takeEvery(IDENTIFY, identifyEventAsync)
}

function* initProviders() {
  const analytics = yield* getContext('analytics')
  const isMobile = yield* getContext('isMobile')

  yield call(analytics.init, isMobile)
}

export default function sagas() {
  return [initProviders, watchTrackEvent, watchIdentifyEvent]
}
