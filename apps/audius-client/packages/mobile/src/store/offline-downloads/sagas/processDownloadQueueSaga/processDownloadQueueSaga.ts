import { reachabilityActions } from '@audius/common'
import {
  takeEvery,
  select,
  call,
  take,
  cancel,
  cancelled,
  put
} from 'typed-redux-saga'

import { getDownloadQueue } from '../../selectors'
import { downloadQueuedItem, QueueStatus, updateQueueStatus } from '../../slice'

import { downloadCollectionWorker } from './downloadCollectionWorker'
import { downloadTrackWorker } from './downloadTrackWorker'
const { SET_UNREACHABLE } = reachabilityActions

export function* processDownloadQueueSaga() {
  while (true) {
    const downloadTask = yield* takeEvery(
      downloadQueuedItem.type,
      processDownloadQueueWorker
    )
    yield* take(SET_UNREACHABLE)
    yield* cancel(downloadTask)
  }
}

function* processDownloadQueueWorker() {
  try {
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
  } finally {
    if (yield* cancelled()) {
      console.log('download cancelled')
    }
  }
}
