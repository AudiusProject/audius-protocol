import { reachabilityActions } from '@audius/common'
import { takeEvery, put, select } from 'typed-redux-saga'

import { getDownloadQueue, getQueueStatus } from '../../selectors'
import {
  requestDownloadQueuedItem,
  QueueStatus,
  updateQueueStatus
} from '../../slice'
const { SET_UNREACHABLE, SET_REACHABLE } = reachabilityActions

export function* watchReachability() {
  yield* takeEvery(SET_UNREACHABLE, function* pauseQueue() {
    yield* put(updateQueueStatus({ queueStatus: QueueStatus.PAUSED }))
  })

  yield* takeEvery(SET_REACHABLE, function* startQueue() {
    const downloadQueue = yield* select(getDownloadQueue)
    const queueStatus = yield* select(getQueueStatus)

    if (downloadQueue.length > 0 && queueStatus === QueueStatus.PAUSED) {
      yield* put(updateQueueStatus({ queueStatus: QueueStatus.PROCESSING }))
      yield* put(requestDownloadQueuedItem())
    }
  })
}
