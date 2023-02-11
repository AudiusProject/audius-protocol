import type { ID, Track, UserTrackMetadata } from '@audius/common'
import {
  accountSelectors,
  getContext,
  reachabilityActions
} from '@audius/common'
import { select, call, put, all, take, race } from 'typed-redux-saga'

import {
  downloadTrackCoverArt,
  purgeDownloadedTrack,
  tryDownloadTrackFromEachCreatorNode,
  writeTrackJson
} from 'app/services/offline-downloader'

import { getTrackOfflineDownloadStatus } from '../../../selectors'
import {
  cancelDownload,
  completeDownload,
  requestDownloadQueuedItem,
  errorDownload,
  OfflineDownloadStatus,
  removeOfflineItems,
  startDownload
} from '../../../slice'
const { SET_UNREACHABLE } = reachabilityActions

const { getUserId } = accountSelectors

function* shouldCancelDownload(trackId: ID) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(getTrackOfflineDownloadStatus(trackId))
    if (!trackStatus) return true
  }
}

export function* downloadTrackWorker(trackId: ID) {
  yield* put(startDownload({ type: 'track', id: trackId }))

  const { downloadTrack, unreachable, cancel } = yield* race({
    downloadTrack: call(downloadTrackAsync, trackId),
    cancel: call(shouldCancelDownload, trackId),
    unreachable: take(SET_UNREACHABLE)
  })

  if (cancel) {
    yield* call(purgeDownloadedTrack, trackId.toString())
    yield* put(requestDownloadQueuedItem())
  } else if (unreachable) {
    yield* put(cancelDownload({ type: 'track', id: trackId }))
    yield* call(purgeDownloadedTrack, trackId.toString())
  } else if (downloadTrack === OfflineDownloadStatus.ERROR) {
    yield* put(errorDownload({ type: 'track', id: trackId }))
    yield* call(purgeDownloadedTrack, trackId.toString())
    yield* put(requestDownloadQueuedItem())
  } else if (downloadTrack === OfflineDownloadStatus.SUCCESS) {
    yield* put(
      completeDownload({ type: 'track', id: trackId, completedAt: Date.now() })
    )
    yield* put(requestDownloadQueuedItem())
  }
}

function* downloadTrackAsync(
  trackId: ID
): Generator<any, OfflineDownloadStatus> {
  const currentUserId = yield* select(getUserId)
  const apiClient = yield* getContext('apiClient')

  const track = yield* call([apiClient, apiClient.getTrack], {
    id: trackId,
    currentUserId
  })

  if (
    !track ||
    track.is_delete ||
    (track.is_unlisted && currentUserId !== track.user.user_id)
  ) {
    return OfflineDownloadStatus.ERROR
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
    return OfflineDownloadStatus.ERROR
  }

  return OfflineDownloadStatus.SUCCESS
}
