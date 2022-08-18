// import signOnSagas from 'audius-client/src/common/store/pages/signon/sagas'
// import accountSagas from 'common/store/account/sagas'
import backendSagas, { setupBackend } from 'common/store/backend/sagas'
// import collectionsSagas from 'common/store/cache/collections/sagas'
// import coreCacheSagas from 'common/store/cache/sagas'
// import tracksSagas from 'common/store/cache/tracks/sagas'
// import usersSagas from 'common/store/cache/users/sagas'
import confirmerSagas from 'common/store/confirmer/sagas'
import remoteConfig from 'common/store/remote-config/sagas'
import { all, fork } from 'typed-redux-saga'

import initKeyboardEvents from './keyboard/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  yield* fork(setupBackend)
  const sagas = [
    // config
    ...backendSagas(),
    // ...accountSagas(),
    ...confirmerSagas(),

    // Cache
    // ...coreCacheSagas(),
    // ...collectionsSagas(),
    // ...tracksSagas(),
    // ...usersSagas(),

    // ...signOnSagas(),
    initKeyboardEvents,
    ...remoteConfig(),
    ...oauthSagas()
  ]

  yield* all(sagas.map(fork))
}
