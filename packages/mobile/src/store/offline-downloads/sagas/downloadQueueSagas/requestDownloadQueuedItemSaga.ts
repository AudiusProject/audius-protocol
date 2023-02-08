import { takeEvery, select, call, put } from 'typed-redux-saga'

import { getDownloadQueue, getQueueStatus } from '../../selectors'
import {
  requestDownloadQueuedItem,
  QueueStatus,
  updateQueueStatus
} from '../../slice'

import { downloadCollectionWorker } from './downloadCollectionWorker'
import { downloadTrackWorker } from './downloadTrackWorker'

export function* requestDownloadQueuedItemSaga() {
  yield* takeEvery(requestDownloadQueuedItem.type, downloadQueuedItem)
}

function* downloadQueuedItem() {
  const queueStatus = yield* select(getQueueStatus)
  if (queueStatus !== QueueStatus.PROCESSING) return

  const downloadQueue = yield* select(getDownloadQueue)
  const [item] = downloadQueue

  // end of the qeueue
  if (!item) {
    yield* put(updateQueueStatus({ queueStatus: QueueStatus.IDLE }))
    return
  }

  const { type, id } = item
  if (type === 'collection') {
    yield* call(downloadCollectionWorker, id)
  } else if (type === 'track') {
    yield* call(downloadTrackWorker, id)
  }
}
