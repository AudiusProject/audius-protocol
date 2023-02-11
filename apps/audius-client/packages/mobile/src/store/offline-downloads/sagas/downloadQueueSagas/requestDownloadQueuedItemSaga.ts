import { takeEvery, select, call, put } from 'typed-redux-saga'

import { getDownloadQueue, getQueueStatus } from '../../selectors'
import {
  requestDownloadQueuedItem,
  QueueStatus,
  updateQueueStatus
} from '../../slice'

import { downloadCollectionWorker } from './workers/downloadCollectionWorker'
import { downloadTrackWorker } from './workers/downloadTrackWorker'
import { playCounterWorker } from './workers/playCounterWorker'
import { staleTrackWorker } from './workers/staleTrackWorker'
import { syncCollectionWorker } from './workers/syncCollectionWorker'

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
  } else if (type === 'collection-sync') {
    yield* call(syncCollectionWorker, id)
  } else if (type === 'play-count') {
    yield* call(playCounterWorker, id)
  } else if (type === 'stale-track') {
    yield* call(staleTrackWorker, id)
  }
}
