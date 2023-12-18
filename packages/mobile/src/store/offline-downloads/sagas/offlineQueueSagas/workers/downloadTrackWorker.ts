import type {
  ID,
  QueryParams,
  Track,
  TrackMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  getQueryParams,
  removeNullable,
  SquareSizes,
  encodeHashId,
  accountSelectors,
  getContext
} from '@audius/common'
import RNFetchBlob from 'rn-fetch-blob'
import { select, call, put, all, take, race } from 'typed-redux-saga'

import { createAllImageSources } from 'app/hooks/useContentNodeImage'
import { make, track } from 'app/services/analytics'
import {
  getLocalAudioPath,
  getLocalTrackCoverArtDestination,
  getLocalTrackDir,
  getLocalTrackJsonPath
} from 'app/services/offline-downloader'
import { getStorageNodeSelector } from 'app/services/sdk/storageNodeSelector'
import { EventNames } from 'app/types/analytics'

import { getTrackOfflineDownloadStatus } from '../../../selectors'
import type { OfflineJob } from '../../../slice'
import {
  cancelJob,
  completeJob,
  requestProcessNextJob,
  errorJob,
  OfflineDownloadStatus,
  removeOfflineItems,
  startJob,
  abandonJob
} from '../../../slice'
import { isTrackDownloadable } from '../../utils/isTrackDownloadable'
import { retryOfflineJob } from '../../utils/retryOfflineJob'
import { shouldAbortJob } from '../../utils/shouldAbortJob'
import { shouldCancelJob } from '../../utils/shouldCancelJob'

import { downloadFile } from './downloadFile'

const { getUserId } = accountSelectors

const MAX_RETRY_COUNT = 3
const MAX_REQUEUE_COUNT = 3

function* shouldAbortDownload(trackId: ID) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(getTrackOfflineDownloadStatus(trackId))
    if (!trackStatus) return true
  }
}

export function* downloadTrackWorker(trackId: ID, requeueCount?: number) {
  const queueItem: OfflineJob = { type: 'track', id: trackId, requeueCount }
  track(
    make({ eventName: EventNames.OFFLINE_MODE_DOWNLOAD_START, ...queueItem })
  )
  yield* put(startJob(queueItem))

  const { jobResult, cancel, abortDownload, abortJob } = yield* race({
    jobResult: retryOfflineJob(
      MAX_RETRY_COUNT,
      1000,
      downloadTrackAsync,
      trackId
    ),
    abortDownload: call(shouldAbortDownload, trackId),
    abortJob: call(shouldAbortJob),
    cancel: call(shouldCancelJob)
  })

  if (abortDownload || abortJob) {
    yield* call(removeDownloadedTrack, trackId)
    yield* put(requestProcessNextJob())
  } else if (cancel) {
    yield* call(removeDownloadedTrack, trackId)
    yield* put(cancelJob(queueItem))
  } else if (jobResult === OfflineDownloadStatus.ERROR) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_FAILURE,
        ...queueItem
      })
    )
    yield* call(removeDownloadedTrack, trackId)
    if ((requeueCount ?? 0) < MAX_REQUEUE_COUNT - 1) {
      yield* put(errorJob(queueItem))
    } else {
      yield* put(abandonJob(queueItem))
    }
    yield* put(requestProcessNextJob())
  } else if (jobResult === OfflineDownloadStatus.ABANDONED) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_FAILURE,
        ...queueItem
      })
    )
    yield* put(abandonJob(queueItem))
    yield* call(removeDownloadedTrack, trackId)
    yield* put(requestProcessNextJob())
  } else if (jobResult === OfflineDownloadStatus.SUCCESS) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_SUCCESS,
        ...queueItem
      })
    )
    yield* put(completeJob({ ...queueItem, completedAt: Date.now() }))
    yield* put(requestProcessNextJob())
  }
}

function* downloadTrackAsync(
  trackId: ID
): Generator<any, OfflineDownloadStatus> {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return OfflineDownloadStatus.ERROR

  const apiClient = yield* getContext('apiClient')

  const track = yield* call([apiClient, apiClient.getTrack], {
    id: trackId,
    currentUserId,
    // Needed to ensure APIClient doesn't abort when we become unreachable,
    // allowing this job time to self-cancel
    abortOnUnreachable: false
  })

  if (!track) return OfflineDownloadStatus.ERROR

  if (!isTrackDownloadable(track, currentUserId)) {
    return OfflineDownloadStatus.ABANDONED
  }

  try {
    yield* all([
      call(downloadTrackCoverArt, track),
      call(downloadTrackAudio, track),
      call(writeTrackMetadata, track)
    ])
  } catch (e) {
    return OfflineDownloadStatus.ERROR
  }

  return OfflineDownloadStatus.SUCCESS
}

function* downloadTrackAudio(track: UserTrackMetadata) {
  const { track_id, user } = track

  const { creator_node_endpoint } = user
  const creatorNodeEndpoints = creator_node_endpoint?.split(',')
  if (!creatorNodeEndpoints) throw new Error('No creator node endpoints')

  const trackFilePath = getLocalAudioPath(track_id)
  const encodedTrackId = encodeHashId(track_id)

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const apiClient = yield* getContext('apiClient')
  let queryParams: QueryParams = {}
  queryParams = yield* call(getQueryParams, { audiusBackendInstance })
  // todo: pass in correct filename and whether to download original or mp3
  queryParams.filename = `${track_id}.mp3`

  const trackAudioUri = apiClient.makeUrl(
    `/tracks/${encodedTrackId}/download`,
    queryParams
  )
  const response = yield* call(downloadFile, trackAudioUri, trackFilePath)
  const { status } = response.info()
  if (status === 200) return

  throw new Error('Unable to download track audio')
}

function* downloadTrackCoverArt(track: TrackMetadata) {
  const { cover_art_cids, cover_art_sizes, cover_art, track_id } = track
  const cid = cover_art_sizes ?? cover_art

  const storageNodeSelector = yield* call(getStorageNodeSelector)

  const imageSources = createAllImageSources({
    cid,
    endpoints: cid ? storageNodeSelector.getNodes(cid) : [],
    size: SquareSizes.SIZE_1000_BY_1000,
    cidMap: cover_art_cids
  })

  const coverArtUris = imageSources.map(({ uri }) => uri).filter(removeNullable)
  const covertArtFilePath = getLocalTrackCoverArtDestination(track_id)

  for (const coverArtUri of coverArtUris) {
    const response = yield* call(downloadFile, coverArtUri, covertArtFilePath)
    const { status } = response.info()
    if (status === 200) return
  }

  throw new Error('Unable to download track cover art')
}

async function writeTrackMetadata(track: UserTrackMetadata) {
  const { track_id } = track

  const trackMetadata: Track & UserTrackMetadata = {
    ...track,
    // Empty cover art sizes because the images are stored locally
    _cover_art_sizes: {}
  }

  const trackMetadataPath = getLocalTrackJsonPath(track_id.toString())

  return await RNFetchBlob.fs.writeFile(
    trackMetadataPath,
    JSON.stringify(trackMetadata)
  )
}

async function removeDownloadedTrack(trackId: ID) {
  const trackDirectory = getLocalTrackDir(trackId.toString())
  const exists = await RNFetchBlob.fs.exists(trackDirectory)
  if (!exists) return
  return await RNFetchBlob.fs.unlink(trackDirectory)
}
