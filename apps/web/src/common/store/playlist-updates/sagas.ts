import { playlistUpdatesSagas } from '@audius/common'

import { playlistUpdatesPollingDaemon } from './playlistUpdatesPollingDaemon'

export default function sagas() {
  return [...playlistUpdatesSagas(), playlistUpdatesPollingDaemon]
}
