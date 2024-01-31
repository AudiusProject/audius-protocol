import { playlistUpdatesSagas } from '@audius/common/store'

import { playlistUpdatesPollingDaemon } from './playlistUpdatesPollingDaemon'

export default function sagas() {
  return [...playlistUpdatesSagas(), playlistUpdatesPollingDaemon]
}
