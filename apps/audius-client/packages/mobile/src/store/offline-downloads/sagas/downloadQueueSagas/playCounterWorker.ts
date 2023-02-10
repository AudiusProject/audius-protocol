import type { ID } from '@audius/common'
import { tracksSocialActions } from '@audius/common'
import { put } from 'typed-redux-saga'

import { completePlayCount, requestDownloadQueuedItem } from '../../slice'

const { recordListen } = tracksSocialActions

export function* playCounterWorker(trackId: ID) {
  yield* put(recordListen(trackId))
  yield* put(completePlayCount())
  yield* put(requestDownloadQueuedItem())
}
