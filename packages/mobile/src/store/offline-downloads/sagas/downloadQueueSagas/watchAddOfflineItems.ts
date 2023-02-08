import { takeEvery, select, put } from 'typed-redux-saga'

import { getDownloadQueue, getQueueStatus } from '../../selectors'
import {
  addOfflineItems,
  requestDownloadQueuedItem,
  QueueStatus,
  updateQueueStatus
} from '../../slice'

export function* watchAddOfflineItems() {
  yield* takeEvery(addOfflineItems.type, startQueueIfIdle)
}

function* startQueueIfIdle() {
  const downloadQueue = yield* select(getDownloadQueue)
  const queueStatus = yield* select(getQueueStatus)

  if (downloadQueue.length > 0 && queueStatus === QueueStatus.IDLE) {
    yield* put(updateQueueStatus({ queueStatus: QueueStatus.PROCESSING }))
    yield* put(requestDownloadQueuedItem())
  }
}
