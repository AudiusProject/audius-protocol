import { remoteConfigSagas as remoteConfig } from '@audius/common'
import analyticsSagas from 'audius-client/src/common/store/analytics/sagas'
import accountSagas from 'common/store/account/sagas'
import backendSagas, { setupBackend } from 'common/store/backend/sagas'
import collectionsSagas from 'common/store/cache/collections/sagas'
import coreCacheSagas from 'common/store/cache/sagas'
import tracksSagas from 'common/store/cache/tracks/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import confirmerSagas from 'common/store/confirmer/sagas'
import notificationsSagas from 'common/store/notifications/sagas'
import collectionPageSagas from 'common/store/pages/collection/sagas'
import feedPageSagas from 'common/store/pages/feed/sagas'
import searchResultsSagas from 'common/store/pages/search-page/sagas'
import signOnSagas from 'common/store/pages/signon/sagas'
import trackPageSagas from 'common/store/pages/track/sagas'
import playerSagas from 'common/store/player/sagas'
import queueSagas from 'common/store/queue/sagas'
import searchBarSagas from 'common/store/search-bar/sagas'
import signOutSagas from 'common/store/sign-out/sagas'
import tippingSagas from 'common/store/tipping/sagas'
import walletSagas from 'common/store/wallet/sagas'
import { all, fork } from 'typed-redux-saga'

import initKeyboardEvents from './keyboard/sagas'
import notificationsSagasNative from './notifications/sagas'
import oauthSagas from './oauth/sagas'

export default function* rootSaga() {
  yield* fork(setupBackend)
  const sagas = [
    // config
    ...backendSagas(),
    ...analyticsSagas(),
    ...accountSagas(),
    ...confirmerSagas(),
    ...searchBarSagas(),
    ...searchResultsSagas(),

    // Cache
    ...coreCacheSagas(),
    ...collectionsSagas(),
    ...tracksSagas(),
    ...usersSagas(),

    // Playback
    queueSagas(),
    ...playerSagas(),
    ...queueSagas(),

    // Sign in / Sign out
    ...signOnSagas(),
    ...signOutSagas(),

    // Tipping
    ...tippingSagas(),

    ...walletSagas(),

    ...notificationsSagas(),
    ...notificationsSagasNative(),

    // Pages
    ...trackPageSagas(),
    ...trackPageSagas(),

    // Pages
    ...trackPageSagas(),
    ...collectionPageSagas(),
    ...feedPageSagas(),

    initKeyboardEvents,
    ...remoteConfig(),
    ...oauthSagas()
  ]

  yield* all(sagas.map(fork))
}
