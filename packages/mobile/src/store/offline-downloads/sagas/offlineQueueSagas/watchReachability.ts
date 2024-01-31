import { reachabilityActions } from '@audius/common/store'
import { takeEvery, put, select } from 'typed-redux-saga'

import { getOfflineQueue, getQueueStatus } from '../../selectors'
import {
  requestProcessNextJob,
  QueueStatus,
  updateQueueStatus
} from '../../slice'
const { SET_UNREACHABLE, SET_REACHABLE } = reachabilityActions

export function* watchReachability() {
  yield* takeEvery(SET_UNREACHABLE, function* pauseQueue() {
    const queueStatus = yield* select(getQueueStatus)

    if (queueStatus === QueueStatus.PROCESSING) {
      yield* put(updateQueueStatus({ queueStatus: QueueStatus.PAUSED }))
    }
  })

  yield* takeEvery(SET_REACHABLE, function* startQueue() {
    const queueStatus = yield* select(getQueueStatus)
    const offlineQueue = yield* select(getOfflineQueue)

    if (offlineQueue.length > 0 && queueStatus === QueueStatus.PAUSED) {
      yield* put(updateQueueStatus({ queueStatus: QueueStatus.PROCESSING }))
      yield* put(requestProcessNextJob())
    }
  })
}
