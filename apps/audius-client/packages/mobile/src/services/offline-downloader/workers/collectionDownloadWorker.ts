import type { CancellablePromise } from 'react-native-job-queue'
import { Worker } from 'react-native-job-queue'

import { downloadCollection } from '../offline-downloader'
import type { CollectionForDownload } from '../types'

export const COLLECTION_DOWNLOAD_WORKER = 'collection_download_worker'
export type CollectionDownloadWorkerPayload = CollectionForDownload

const onFailure = ({ payload }: { payload: CollectionForDownload }) => {}

const executor = (payload: CollectionDownloadWorkerPayload) => {
  const promise: CancellablePromise<void> = downloadCollection(payload)
  return promise
}

export const collectionDownloadWorker = new Worker(
  COLLECTION_DOWNLOAD_WORKER,
  executor,
  {
    onFailure,
    concurrency: 1
  }
)
