import { RemoteConfigInstance } from '@audius/common'
import { eventChannel, END } from 'redux-saga'
import { put, take } from 'redux-saga/effects'

import { setDidLoad } from './slice'

const CLIENT_READY_EVENT = 'CLIENT_READY'

const remoteConfigSagas = (remoteConfigInstance: RemoteConfigInstance) => {
  function* watchRemoteConfigLoad() {
    // Emit event when provider is ready
    const chan = eventChannel((emitter) => {
      remoteConfigInstance.onClientReady(() => {
        emitter(CLIENT_READY_EVENT)
        emitter(END)
      })
      return () => {}
    })

    // await event before setting didLoad
    yield take(chan)
    yield put(setDidLoad())
  }

  return [watchRemoteConfigLoad]
}

export default remoteConfigSagas
