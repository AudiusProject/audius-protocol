import { takeEvery, select, put } from 'typed-redux-saga'

import { getOfflineQueue, getQueueStatus } from '../../selectors'
import {
  addOfflineEntries,
  requestProcessNextJob,
  QueueStatus,
  updateQueueStatus
} from '../../slice'

export function* watchAddOfflineEntries() {
  yield* takeEvery(addOfflineEntries.type, startQueueIfIdle)
}

function* startQueueIfIdle() {
  const offlineQueue = yield* select(getOfflineQueue)
  const queueStatus = yield* select(getQueueStatus)

  if (offlineQueue.length > 0 && queueStatus === QueueStatus.IDLE) {
    yield* put(updateQueueStatus({ queueStatus: QueueStatus.PROCESSING }))
    yield* put(requestProcessNextJob())
  }
}
