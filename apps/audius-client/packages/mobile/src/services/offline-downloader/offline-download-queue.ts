import type { ID } from '@audius/common'
import { isEqual, groupBy } from 'lodash'
import queue from 'react-native-job-queue'

import { store } from 'app/store'
import {
  batchInitCollectionDownload,
  batchInitDownload,
  errorCollectionDownload,
  errorDownload,
  removeCollectionDownload
} from 'app/store/offline-downloads/slice'

import type { CollectionForDownload, TrackForDownload } from './types'
import type { CollectionDownloadWorkerPayload } from './workers/collectionDownloadWorker'
import {
  collectionDownloadWorker,
  COLLECTION_DOWNLOAD_WORKER
} from './workers/collectionDownloadWorker'
import {
  playCounterWorker,
  PLAY_COUNTER_WORKER
} from './workers/playCounterWorker'
import type { TrackDownloadWorkerPayload } from './workers/trackDownloadWorker'
import {
  trackDownloadWorker,
  TRACK_DOWNLOAD_WORKER
} from './workers/trackDownloadWorker'

export const isEqualCollectionPayload = isEqual

export const isEqualTrackPayload = (
  a: TrackDownloadWorkerPayload,
  b: TrackDownloadWorkerPayload
) => {
  const { favoriteCreatedAt: ignoredAFavoriteCreatedAt, ...aPayload } = a
  const { favoriteCreatedAt: ignoredBFavoriteCreatedAt, ...bPayload } = b
  return isEqual(aPayload, bPayload)
}

export const enqueueCollectionDownload = async (
  collectionForDownload: CollectionForDownload
) => {
  queue.addJob<CollectionDownloadWorkerPayload>(
    COLLECTION_DOWNLOAD_WORKER,
    collectionForDownload,
    {
      attempts: 3,
      priority: 1,
      timeout: 30 * 60 * 1000
    }
  )
}

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
    updateInterval: 500
  })

  // Reset worker to improve devEx. Forces the worker to take code updates across reloads
  removeExistingWorkers()
  queue.addWorker(trackDownloadWorker)
  queue.addWorker(collectionDownloadWorker)
  queue.addWorker(playCounterWorker)

  // Sync leftover jobs from last session to redux state
  const jobs = await queue.getJobs()
  const favoritedCollectionIdsInQueue: ID[] = []
  const collectionIdsInQueue: ID[] = []
  jobs
    .filter((job) => job.workerName === COLLECTION_DOWNLOAD_WORKER)
    .forEach((job) => {
      try {
        const { payload, failed } = job
        const parsedPayload: CollectionDownloadWorkerPayload =
          JSON.parse(payload)
        const { collectionId, isFavoritesDownload } = parsedPayload
        if (failed) {
          store.dispatch(errorCollectionDownload(parsedPayload))
          queue.removeJob(job)
        } else {
          isFavoritesDownload
            ? favoritedCollectionIdsInQueue.push(collectionId)
            : collectionIdsInQueue.push(collectionId)
        }
      } catch (e) {
        console.warn(e)
      }
    })
  store.dispatch(
    batchInitCollectionDownload({
      collectionIds: favoritedCollectionIdsInQueue,
      isFavoritesDownload: true
    })
  )
  store.dispatch(
    batchInitCollectionDownload({
      collectionIds: collectionIdsInQueue,
      isFavoritesDownload: false
    })
  )

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

  store.dispatch(batchInitDownload(trackIdsInQueue))

  queue.start()
}

export const cancelQueuedCollectionDownloads = async (
  payloadsToCancel: CollectionDownloadWorkerPayload[]
) => {
  const payloadsToCancelById = groupBy(
    payloadsToCancel,
    (payload) => payload.collectionId
  )
  queue.stop()
  const jobs = await queue.getJobs()
  jobs.forEach((rawJob) => {
    const { workerName, payload, id, active } = rawJob
    try {
      if (workerName === COLLECTION_DOWNLOAD_WORKER) {
        const parsedPayload: CollectionDownloadWorkerPayload =
          JSON.parse(payload)
        const shouldCancel = (
          payloadsToCancelById[parsedPayload.collectionId] ?? []
        ).some((payloadToCancel) =>
          isEqualCollectionPayload(payloadToCancel, parsedPayload)
        )

        if (shouldCancel) {
          if (active && id) {
            // Still has attempts left
            queue.cancelJob(id)
          } else {
            // No attempts left
            queue.removeJob(rawJob)
          }
          // TODO: check if still needed
          store.dispatch(removeCollectionDownload(parsedPayload))
        }
      }
    } catch (e) {
      console.warn(e)
    }
  })
  queue.start()
}

export const cancelQueuedDownloads = async (
  payloadsToCancel: TrackDownloadWorkerPayload[]
) => {
  const payloadsToCancelById = groupBy(
    payloadsToCancel,
    (payload) => payload.trackId
  )
  queue.stop()
  const jobs = await queue.getJobs()
  jobs.forEach((rawJob) => {
    const { workerName, payload, id, active } = rawJob
    try {
      if (workerName === TRACK_DOWNLOAD_WORKER) {
        const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(payload)
        const shouldCancel = (
          payloadsToCancelById[parsedPayload.trackId] ?? []
        ).some((payloadToCancel) =>
          isEqualTrackPayload(payloadToCancel, parsedPayload)
        )

        if (shouldCancel) {
          if (active && id) {
            // Still has attempts left
            queue.cancelJob(id)
          } else {
            // No attempts left
            queue.removeJob(rawJob)
          }
        }
      }
    } catch (e) {
      console.warn(e)
    }
  })
  queue.start()
}
