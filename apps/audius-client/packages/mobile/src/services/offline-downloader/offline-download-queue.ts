import queue, { Worker } from 'react-native-job-queue'

import { store } from 'app/store'
import { errorDownload, startDownload } from 'app/store/offline-downloads/slice'

import { downloadTrack } from './offline-downloader'

const TRACK_DOWNLOAD_WORKER = 'track_download_worker'

export type TrackDownloadWorkerPayload = {
  trackId: number
  collection: string
}

export const enqueueTrackDownload = async (
  trackId: number,
  collection: string
) => {
  store.dispatch(startDownload(trackId.toString()))

  queue.addJob(
    TRACK_DOWNLOAD_WORKER,
    { trackId, collection },
    {
      attempts: 3,
      priority: 1,
      timeout: 30000 // TODO: what's a reasonable timeout?
    }
  )
}

export const startDownloadWorker = async () => {
  queue.stop()
  queue.configure({
    concurrency: 10,
    updateInterval: 10
  })

  const worker = queue.registeredWorkers[TRACK_DOWNLOAD_WORKER]
  // Reset worker to improve devEx. Forces the worker to take code updates across reloads
  if (worker) queue.removeWorker(TRACK_DOWNLOAD_WORKER, true)
  queue.addWorker(
    new Worker(TRACK_DOWNLOAD_WORKER, downloadTrack, {
      onFailure: ({ payload }) =>
        store.dispatch(errorDownload(payload.trackId.toString())),
      concurrency: 10
    })
  )
  const jobs = await queue.getJobs()
  jobs
    .filter((job) => job.workerName === TRACK_DOWNLOAD_WORKER)
    .forEach(({ payload }) => {
      try {
        const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(payload)
        const trackId = parsedPayload.trackId
        store.dispatch(startDownload(trackId.toString()))
      } catch (e) {
        console.warn(e)
      }
    })

  setTimeout(queue.start, 1000)
}
