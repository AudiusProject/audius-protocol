import type { CancellablePromise } from 'react-native-job-queue'
import queue, { Worker } from 'react-native-job-queue'

import { isEqualCollectionPayload } from 'app/services/offline-downloader/offline-download-queue'

import {
  downloadCollection,
  DownloadCollectionError
} from '../offline-downloader'
import type { CollectionForDownload } from '../types'

import { startQueueIfOnline } from './utils'

export const COLLECTION_DOWNLOAD_WORKER = 'collection_download_worker'
export type CollectionDownloadWorkerPayload = CollectionForDownload

const onFailure = async (
  { payload }: { payload: CollectionForDownload },
  error: Error
) => {
  switch (error.message) {
    case DownloadCollectionError.IS_DELETED:
    case DownloadCollectionError.IS_PRIVATE: {
      queue.stop()
      const jobs = await queue.getJobs()
      try {
        jobs.forEach((rawJob) => {
          if (rawJob.workerName === COLLECTION_DOWNLOAD_WORKER) {
            const parsedPayload: CollectionDownloadWorkerPayload = JSON.parse(
              rawJob.payload
            )
            if (isEqualCollectionPayload(payload, parsedPayload)) {
              queue.removeJob(rawJob)
            }
          }
        })
      } catch (e) {
        console.warn(e)
      }
      startQueueIfOnline()
      break
    }
    default:
      break
  }
}

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
