import remoteConfig from 'audius-client/src/common/store/remote-config/sagas'
import { fork } from 'redux-saga/effects'

import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

import initKeyboardEvents from './keyboard/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  const sagas = [
    initKeyboardEvents,
    ...remoteConfig(remoteConfigInstance),
    ...oauthSagas()
  ]
  yield sagas.map(fork)
}
