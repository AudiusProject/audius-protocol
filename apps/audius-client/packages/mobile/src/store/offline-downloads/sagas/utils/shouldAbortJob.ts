import { take } from 'typed-redux-saga'

import { clearOfflineDownloads } from '../../slice'

export function* shouldAbortJob() {
  yield* take([clearOfflineDownloads])
  return true
}
