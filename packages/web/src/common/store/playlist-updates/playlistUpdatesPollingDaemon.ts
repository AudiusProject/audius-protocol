import {
  accountActions,
  getContext,
  playlistUpdatesActions
} from '@audius/common/store'

import { IntKeys, remoteConfigIntDefaults } from '@audius/common/services'
import { call, fork, take } from 'typed-redux-saga'

import {
  foregroundPollingDaemon,
  visibilityPollingDaemon
} from 'utils/sagaPollingDaemons'
const { fetchAccountSucceeded } = accountActions
const { fetchPlaylistUpdates } = playlistUpdatesActions

export function* playlistUpdatesPollingDaemon() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)

  const pollingInterval =
    remoteConfigInstance.getRemoteVar(IntKeys.NOTIFICATION_POLLING_FREQ_MS) ??
    (remoteConfigIntDefaults[IntKeys.NOTIFICATION_POLLING_FREQ_MS] as number)

  yield* take(fetchAccountSucceeded.type)

  yield* fork(visibilityPollingDaemon, fetchPlaylistUpdates())
  yield* fork(foregroundPollingDaemon, fetchPlaylistUpdates(), pollingInterval)
}
