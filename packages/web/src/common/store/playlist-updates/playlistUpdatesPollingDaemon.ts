import {
  accountActions,
  getContext,
  playlistUpdatesActions
} from '@audius/common/store'
import { call, fork, take } from 'typed-redux-saga'

import {
  foregroundPollingDaemon,
  visibilityPollingDaemon
} from 'utils/sagaPollingDaemons'

const PLAYLIST_UPDATES_POLLING_FREQ_MS = 1 * 60 * 1000 // once per 1 minute

const { fetchAccountSucceeded } = accountActions
const { fetchPlaylistUpdates } = playlistUpdatesActions

export function* playlistUpdatesPollingDaemon() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)

  const pollingInterval = PLAYLIST_UPDATES_POLLING_FREQ_MS

  yield* take(fetchAccountSucceeded.type)

  yield* fork(visibilityPollingDaemon, fetchPlaylistUpdates())
  yield* fork(foregroundPollingDaemon, fetchPlaylistUpdates(), pollingInterval)
}
