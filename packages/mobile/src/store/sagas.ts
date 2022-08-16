import remoteConfig from 'common/store/remote-config/sagas'
import { all, fork } from 'typed-redux-saga'

import initKeyboardEvents from './keyboard/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  const sagas = [
    // config
    initKeyboardEvents,
    ...remoteConfig(),
    ...oauthSagas()
  ]

  yield* all(sagas.map(fork))
}
