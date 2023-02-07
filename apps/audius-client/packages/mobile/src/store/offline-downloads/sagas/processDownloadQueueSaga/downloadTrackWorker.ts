import type { ID, Track, UserTrackMetadata } from '@audius/common'
import { accountSelectors, getContext } from '@audius/common'
import { select, call, put, all } from 'typed-redux-saga'

import {
  downloadTrackCoverArt,
  DownloadTrackError,
  tryDownloadTrackFromEachCreatorNode,
  verifyTrack,
  writeTrackJson
} from 'app/services/offline-downloader'

import {
  completeDownload,
  downloadQueuedItem,
  errorDownload,
  startDownload
} from '../../slice'

const { getUserId } = accountSelectors

export function* downloadTrackWorker(trackId: ID) {
  yield* put(startDownload({ type: 'track', id: trackId }))

  const currentUserId = yield* select(getUserId)

  const apiClient = yield* getContext('apiClient')

  const track = yield* call([apiClient, apiClient.getTrack], {
    id: trackId,
    currentUserId
  })

  if (!track) {
    yield* call(trackDownloadFailed, {
      id: trackId,
      message: `track to {download not found on discovery - ${trackId}`,
      error: DownloadTrackError.FAILED_TO_FETCH
    })
    return
  }
  if (track.is_delete) {
    yield* call(trackDownloadFailed, {
      id: trackId,
      message: `track to download is deleted - ${trackId}`,
      error: DownloadTrackError.IS_DELETED
    })
    return
  }

  if (track.is_unlisted && currentUserId !== track.user.user_id) {
    yield* call(trackDownloadFailed, {
      id: trackId,
      message: `track to download is unlisted and user is not owner - ${trackId} - ${currentUserId}`,
      error: DownloadTrackError.IS_UNLISTED
    })
    return
  }

  const trackMetadata: Track & UserTrackMetadata = {
    ...track,
    // Empty cover art sizes because the images are stored locally
    _cover_art_sizes: {}
  }

  try {
    yield* all([
      call(downloadTrackCoverArt, track),
      call(tryDownloadTrackFromEachCreatorNode, track)
    ])

    yield* call(writeTrackJson, trackId.toString(), trackMetadata)
  } catch (e) {
    yield* call(trackDownloadFailed, {
      id: trackId,
      message: e?.message ?? 'Unknown Error',
      error: DownloadTrackError.UNKNOWN
    })
    return
  }

  const verified = yield* call(verifyTrack, trackId.toString(), true)

  if (!verified) {
    yield* call(trackDownloadFailed, {
      id: trackId,
      message: `DownloadQueueWorker - download verification failed ${trackId}`,
      error: DownloadTrackError.FAILED_TO_VERIFY
    })
    return
  }

  yield* put(
    completeDownload({ type: 'track', id: trackId, completedAt: Date.now() })
  )

  yield* put(downloadQueuedItem())
}

type TrackDownloadFailedConfig = {
  id: ID
  message: string
  error: DownloadTrackError
}

function* trackDownloadFailed(config: TrackDownloadFailedConfig) {
  const { id, message, error } = config
  yield* put(errorDownload({ type: 'track', id }))
  if (
    error === DownloadTrackError.IS_DELETED ||
    error === DownloadTrackError.IS_UNLISTED
  ) {
    // todo, maybe do something
  }

  // todo post error message?
  console.error(message)
  yield* put(downloadQueuedItem())
}
