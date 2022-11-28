import type { Track, User } from '@audius/common'
import { cacheTracksSelectors, cacheUsersSelectors } from '@audius/common'
import queue, { Worker } from 'react-native-job-queue'

import { store } from 'app/store'
import { errorDownload, startDownload } from 'app/store/offline-downloads/slice'

import { downloadTrack } from './offline-downloader'
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

const TRACK_DOWNLOAD_WORKER = 'track_download_worker'

export type TrackDownloadWorkerPayload = {
  track: Track
  user: User
  collection: string
}

export const enqueueTrackDownload = async (
  trackId: number,
  collection: string
) => {
  const state = store.getState()
  const track = getTrack(state, { id: trackId })
  const user = getUser(state, { id: track?.owner_id })
  const trackIdString = trackId.toString()
  if (!track || !user) {
    // TODO: try getting it from the API
    store.dispatch(errorDownload(trackIdString))
    return false
  }

  store.dispatch(startDownload(trackIdString))

  queue.addJob(
    TRACK_DOWNLOAD_WORKER,
    { track, collection, user },
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
  queue.addWorker(new Worker(TRACK_DOWNLOAD_WORKER, downloadTrack))
  const jobs = await queue.getJobs()
  jobs
    .filter((job) => job.workerName === TRACK_DOWNLOAD_WORKER)
    .forEach(({ payload }) => {
      try {
        const parsedPayload: TrackDownloadWorkerPayload = JSON.parse(payload)
        const trackId = parsedPayload.track.track_id
        store.dispatch(startDownload(trackId.toString()))
      } catch (e) {
        console.warn(e)
      }
    })
  queue.start()
}
