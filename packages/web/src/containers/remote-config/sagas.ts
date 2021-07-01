import { eventChannel, END } from 'redux-saga'
import { put, take } from 'redux-saga/effects'

import { onProviderReady } from 'services/remote-config/Provider'

import { setDidLoad } from './slice'

const PROVIDER_READY_EVENT = 'PROVIDER_READY'

function* watchRemoteConfigLoad() {
  // Emit event when provider is ready
  const chan = eventChannel(emitter => {
    onProviderReady(() => {
      emitter(PROVIDER_READY_EVENT)
      emitter(END)
    })
    return () => {}
  })

  // await event before setting didLoad
  yield take(chan)
  yield put(setDidLoad())
}

export default function sagas() {
  return [watchRemoteConfigLoad]
}
