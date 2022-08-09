import remoteConfig from 'audius-client/src/common/store/remote-config/sagas'
import { all, fork } from 'typed-redux-saga'

import initKeyboardEvents from './keyboard/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  const sagas = [
    initKeyboardEvents,
    ...remoteConfig(),
    ...oauthSagas()
  ]
  yield* all(sagas.map(fork))
}
