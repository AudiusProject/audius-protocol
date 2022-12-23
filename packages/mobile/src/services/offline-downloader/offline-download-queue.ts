import { isEqual, groupBy } from 'lodash'
import queue from 'react-native-job-queue'

import type { TrackForDownload } from 'app/components/offline-downloads'
import { store } from 'app/store'
import {
  batchStartDownload,
  errorDownload,
  removeDownload
} from 'app/store/offline-downloads/slice'

import {
  playCounterWorker,
  PLAY_COUNTER_WORKER
} from './workers/playCounterWorker'
import type { TrackDownloadWorkerPayload } from './workers/trackDownloadWorker'
import {
  trackDownloadWorker,
  TRACK_DOWNLOAD_WORKER
} from './workers/trackDownloadWorker'

export const enqueueTrackDownload = async (
  trackForDownload: TrackForDownload
) => {
  queue.addJob<TrackDownloadWorkerPayload>(
    TRACK_DOWNLOAD_WORKER,
    trackForDownload,
    {
      attempts: 3,
      priority: 1,
      timeout: 30 * 60 * 1000
    }
  )
}

const removeExistingWorkers = () => {
  const workerTypes = [TRACK_DOWNLOAD_WORKER, PLAY_COUNTER_WORKER]
  workerTypes.forEach((workerType) => {
    const existingWorker = queue.registeredWorkers[workerType]
    if (existingWorker) queue.removeWorker(workerType, true)
  })
}

export const startDownloadWorker = async () => {
  queue.stop()
  queue.configure({
    concurrency: 1,
    updateInterval: 10
  })

  // Reset worker to improve devEx. Forces the worker to take code updates across reloads
  removeExistingWorkers()
  queue.addWorker(trackDownloadWorker)
  queue.addWorker(playCounterWorker)

  // Sync leftover jobs from last session to redux state
  const jobs = await queue.getJobs()
  const trackIdsInQueue: string[] = []
  jobs
    .filter((job) => job.workerName === TRACK_DOWNLOAD_WORKER)
    .forEach((job) => {
      try {
        const { payload, failed } = job
        const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(payload)
        const { trackId } = parsedPayload
        if (failed) {
          store.dispatch(errorDownload(trackId.toString()))
          queue.removeJob(job)
        } else {
          trackIdsInQueue.push(trackId.toString())
        }
      } catch (e) {
        console.warn(e)
      }
    })

  store.dispatch(batchStartDownload(trackIdsInQueue))

  queue.start()
}

export const cancelQueuedDownloads = async (
  payloadsToCancel: TrackDownloadWorkerPayload[]
) => {
  const payloadsToCancelById = groupBy(
    payloadsToCancel,
    (payload) => payload.trackId
  )
  const jobs = await queue.getJobs()
  const jobsToCancel = jobs.filter(({ workerName, payload }) => {
    try {
      const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(payload)
      return (
        workerName === TRACK_DOWNLOAD_WORKER &&
        (payloadsToCancelById[parsedPayload.trackId] ?? []).some(
          (payloadToCancel) => isEqual(payloadToCancel, parsedPayload)
        )
      )
    } catch (e) {
      console.warn(e)
      return false
    }
  })
  queue.stop()
  jobsToCancel.forEach(async (rawJob) => {
    try {
      const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(
        rawJob.payload
      )
      rawJob.active ? queue.cancelJob(rawJob.id) : queue.removeJob(rawJob)

      store.dispatch(removeDownload(parsedPayload.trackId.toString()))
    } catch (e) {
      console.warn(e)
    }
  })
  queue.start()
}
