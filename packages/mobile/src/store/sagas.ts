import remoteConfig from 'audius-client/src/common/store/remote-config/sagas'
import { fork } from 'redux-saga/effects'

import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

import initKeyboardEvents from './keyboard/sagas'

export default function* rootSaga() {
  // executing array of effects was deprecated in v1 of redux-saga
  // must call them in the all effect now
  // https://stackoverflow.com/questions/55811145/redux-saga-does-not-run/55811902#55811902
  const sagas = [initKeyboardEvents, ...remoteConfig(remoteConfigInstance)]
  yield sagas.map(fork)
}
