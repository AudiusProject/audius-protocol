import type { CancellablePromise } from 'react-native-job-queue'
import { Worker } from 'react-native-job-queue'

import { store } from 'app/store'
import { errorDownload } from 'app/store/offline-downloads/slice'

import { batchRemoveTrackDownload, downloadTrack } from '../offline-downloader'
import type { TrackForDownload } from '../types'

export const TRACK_DOWNLOAD_WORKER = 'track_download_worker'
export type TrackDownloadWorkerPayload = TrackForDownload

const onFailure = ({ payload }: { payload: TrackForDownload }) => {
  store.dispatch(errorDownload(payload.trackId.toString()))
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
