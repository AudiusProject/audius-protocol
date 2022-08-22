import { eventChannel, END } from 'redux-saga'
import { put, take } from 'typed-redux-saga'

import { getContext } from '../effects'

import { setDidLoad } from './slice'

const CLIENT_READY_EVENT = 'CLIENT_READY'

function* watchRemoteConfigLoad() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  // Emit event when provider is ready
  const chan = eventChannel((emitter) => {
    remoteConfigInstance.onClientReady(() => {
      emitter(CLIENT_READY_EVENT)
      emitter(END)
    })
    return () => {}
  })

  // await event before setting didLoad
  yield* take(chan)
  yield* put(setDidLoad())
}

const remoteConfigSagas = () => {
  return [watchRemoteConfigLoad]
}

export default remoteConfigSagas
