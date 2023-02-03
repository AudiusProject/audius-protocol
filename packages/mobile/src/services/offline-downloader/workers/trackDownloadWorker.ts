import type { CancellablePromise } from 'react-native-job-queue'
import queue, { Worker } from 'react-native-job-queue'

import { isEqualTrackPayload } from 'app/services/offline-downloader/offline-download-queue'
import { store } from 'app/store'
import { errorDownload } from 'app/store/offline-downloads/slice'

import {
  batchRemoveTrackDownload,
  downloadTrack,
  DownloadTrackError
} from '../offline-downloader'
import type { TrackForDownload } from '../types'

import { startQueueIfOnline } from './utils'

export const TRACK_DOWNLOAD_WORKER = 'track_download_worker'
export type TrackDownloadWorkerPayload = TrackForDownload

const onFailure = async (
  { payload }: { payload: TrackForDownload },
  error: Error
) => {
  switch (error.message) {
    case DownloadTrackError.IS_DELETED:
    case DownloadTrackError.IS_UNLISTED: {
      queue.stop()
      const jobs = await queue.getJobs()
      try {
        jobs.forEach((rawJob) => {
          if (rawJob.workerName === TRACK_DOWNLOAD_WORKER) {
            const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(
              rawJob.payload
            )
            if (isEqualTrackPayload(payload, parsedPayload)) {
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

const executor = (payload: TrackDownloadWorkerPayload) => {
  const promise: CancellablePromise<void> = downloadTrack(payload)
  promise.rn_job_queue_cancel = () => {
    promise.finally(() => {
      store.dispatch(errorDownload(payload.trackId.toString()))
      batchRemoveTrackDownload([payload])
    })
  }
  return promise
}

export const trackDownloadWorker = new Worker(TRACK_DOWNLOAD_WORKER, executor, {
  onFailure,
  concurrency: 1
})
