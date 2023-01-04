import type { CancellablePromise } from 'react-native-job-queue'
import { Worker } from 'react-native-job-queue'

import type { TrackForDownload } from 'app/components/offline-downloads'
import { store } from 'app/store'
import {
  errorDownload,
  removeDownload
} from 'app/store/offline-downloads/slice'

import { batchRemoveTrackDownload, downloadTrack } from '../offline-downloader'

export const TRACK_DOWNLOAD_WORKER = 'track_download_worker'
export type TrackDownloadWorkerPayload = TrackForDownload

const onFailure = ({ payload }: { payload: TrackForDownload }) => {
  store.dispatch(errorDownload(payload.trackId.toString()))
}

const executor = (payload: TrackDownloadWorkerPayload) => {
  const promise: CancellablePromise<void> = downloadTrack(payload)
  promise.rn_job_queue_cancel = () => {
    promise.finally(() => {
      store.dispatch(removeDownload(payload.trackId.toString()))
      batchRemoveTrackDownload([payload])
    })
  }
  return promise
}

export const trackDownloadWorker = new Worker(TRACK_DOWNLOAD_WORKER, executor, {
  onFailure,
  concurrency: 10
})
