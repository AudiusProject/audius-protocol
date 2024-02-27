import {
  Collection,
  CollectionMetadata,
  ID,
  Kind,
  Name
} from '@audius/common/models'
import { CollectionValues } from '@audius/common/schemas'
import {
  ExtendedTrackMetadata,
  LibraryCategory,
  ProgressStatus,
  UploadTrack,
  UploadType,
  accountActions,
  accountSelectors,
  cacheActions,
  cacheUsersSelectors,
  confirmTransaction,
  confirmerActions,
  getContext,
  reformatCollection,
  savedPageActions,
  uploadActions
} from '@audius/common/store'
import {
  actionChannelDispatcher,
  makeUid,
  waitForAccount
} from '@audius/common/utils'
import { EntityManagerAction } from '@audius/sdk'
import type { ProgressCB } from '@audius/sdk/dist/services/creatorNode'
import type { TrackMetadata } from '@audius/sdk/dist/utils'
import { Channel, Task, buffers, channel } from 'redux-saga'
import {
  all,
  call,
  cancel,
  fork,
  put,
  select,
  takeLatest,
  take
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import * as errorActions from 'store/errors/actions'
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite } from 'utils/sagaHelpers'

import { getUnclaimedPlaylistId } from '../cache/collections/utils/getUnclaimedPlaylistId'
import { trackNewRemixEvent } from '../cache/tracks/sagas'
import { retrieveTracks } from '../cache/tracks/utils'
import { adjustUserField } from '../cache/users/sagas'
import { addPlaylistsNotInLibrary } from '../playlist-library/sagas'

import { processTrackForUpload, recordGatedTracks } from './sagaHelpers'

const { updateProgress } = uploadActions

type ProgressAction = ReturnType<typeof updateProgress>

/**
 * Combines the metadata for a track and a collection (playlist or album),
 * taking the metadata from the playlist when the track is missing it.
 */
const combineMetadata = (
  trackMetadata: ExtendedTrackMetadata,
  collectionMetadata: CollectionValues
) => {
  const metadata = trackMetadata
  metadata.artwork = trackMetadata.artwork ?? collectionMetadata.artwork

  if (!metadata.genre)
    metadata.genre = collectionMetadata.trackDetails.genre ?? ''
  if (!metadata.mood) metadata.mood = collectionMetadata.trackDetails.mood ?? ''
  if (!metadata.release_date)
    metadata.release_date = collectionMetadata.release_date ?? null

  if (metadata.tags === null && collectionMetadata.trackDetails.tags) {
    // Take collection tags
    metadata.tags = collectionMetadata.trackDetails.tags
  }
  return trackMetadata
}

const makeOnProgress = (
  index: number,
  progressChannel: Channel<ProgressAction>
) => {
  return (progress: Parameters<ProgressCB>[0]) => {
    const key = 'audio' in progress ? 'audio' : 'art'
    const p =
      'audio' in progress
        ? progress.audio
        : 'art' in progress
        ? progress.art
        : null
    if (p === null) {
      return
    }
    const { upload, transcode } = p
    try {
      progressChannel.put(
        updateProgress(index, key, {
          loaded: upload?.loaded,
          total: upload?.total,
          transcode: transcode?.decimal,
          status:
            !upload || upload.loaded !== upload.total
              ? ProgressStatus.UPLOADING
              : ProgressStatus.PROCESSING
        })
      )
    } catch {
      // Sometimes this can fail repeatedly in quick succession (root cause TBD)
      // it doesn't seem to affect the CX so catch to avoid spamming sentry
    }
  }
}

function* deleteTracks(trackIds: ID[]) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const libs = yield* call(audiusBackendInstance.getAudiusLibsTyped)

  yield* all(
    trackIds.map((id) => call([libs.Track, libs.Track!.deleteTrack], id))
  )
}

function* uploadWorker(
  uploadQueue: Channel<UploadTask>,
  progressChannel: Channel<ProgressAction>,
  responseChannel: Channel<UploadTrackResponse>
) {
  while (true) {
    const task = yield* take(uploadQueue)
    const { index, track } = task
    try {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      const libs = yield* call(audiusBackendInstance.getAudiusLibsTyped)

      const updatedMetadata = yield* call(
        [libs.Track, libs.Track!.uploadTrackV2],
        track.file as File,
        (track.metadata.artwork?.file ?? null) as File | null,
        track.metadata as unknown as TrackMetadata,
        makeOnProgress(index, progressChannel)
      )
      yield* put(responseChannel, {
        type: 'UPLOADED',
        payload: { index, metadata: updatedMetadata }
      })
    } catch (e) {
      yield* put(responseChannel, {
        type: 'ERROR',
        payload: { phase: 'upload', index, error: e }
      })
    }
  }
}

function* publishWorker(
  publishQueue: Channel<PublishTask>,
  responseChannel: Channel<UploadTrackResponse>
) {
  while (true) {
    const task = yield* take(publishQueue)
    const { index, trackId: presetTrackId, metadata } = task
    try {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      const libs = yield* call(audiusBackendInstance.getAudiusLibsTyped)
      const {
        trackId: updatedTrackId,
        txReceipt: { blockHash, blockNumber }
      } = yield* call(
        [libs.Track, libs.Track!.writeTrackToChain],
        metadata,
        EntityManagerAction.CREATE,
        presetTrackId
      )
      const confirmed = yield* call(confirmTransaction, blockHash, blockNumber)
      if (!confirmed) {
        throw new Error(
          `Could not confirm track upload for track id ${updatedTrackId}`
        )
      }
      yield* put(responseChannel, {
        type: 'PUBLISHED',
        payload: { index, trackId: updatedTrackId }
      })
    } catch (e) {
      yield* put(responseChannel, {
        type: 'ERROR',
        payload: { phase: 'publish', index, error: e }
      })
    }
  }
}

type UploadTask = {
  index: number
  track: UploadTrack
}

type ErrorPayload = {
  index: number
  trackId?: ID
  phase: 'upload' | 'publish'
  error: unknown
}

type UploadedPayload = {
  index: number
  metadata: TrackMetadata
}

type PublishedPayload = {
  index: number
  trackId: ID
}

type UploadTrackResponse =
  | { type: 'ERROR'; payload: ErrorPayload }
  | { type: 'UPLOADED'; payload: UploadedPayload }
  | { type: 'PUBLISHED'; payload: PublishedPayload }

type PublishTask = {
  index: number
  trackId: ID
  metadata: TrackMetadata
}

export function* handleUploads({
  tracks,
  kind
}: {
  tracks: UploadTrack[]
  kind: 'album' | 'playlist' | 'tracks' | 'stems'
}) {
  const isCollection = kind === 'album' || kind === 'playlist'
  const numUploadWorkers = 4
  const numPublishWorkers = 4
  const uploadQueue = yield* call(
    channel<UploadTask>,
    buffers.expanding(tracks.length)
  )
  const publishQueue = yield* call(
    channel<PublishTask>,
    buffers.expanding(tracks.length)
  )
  const responseChannel = yield* call(
    channel<UploadTrackResponse>,
    buffers.expanding(10)
  )

  const progressChannel = yield* call(channel<ProgressAction>)
  const actionDispatcherTask = yield* fork(
    actionChannelDispatcher,
    progressChannel
  )

  console.debug(
    `Spinning up ${numUploadWorkers} upload workers and ${numPublishWorkers} publish workers`
  )
  const uploadWorkers: Task[] = []
  for (let i = 0; i < numUploadWorkers; i++) {
    uploadWorkers.push(
      yield* fork(uploadWorker, uploadQueue, progressChannel, responseChannel)
    )
  }
  const publishWorkers: Task[] = []
  for (let i = 0; i < numPublishWorkers; i++) {
    publishWorkers.push(
      yield* fork(publishWorker, publishQueue, responseChannel)
    )
  }

  for (let i = 0; i < tracks.length; i++) {
    uploadQueue.put({ index: i, track: tracks[i] })
  }

  const pendingStemCount = tracks.reduce<Record<ID, number>>(
    (prev, parent) => ({
      ...prev,
      [parent.metadata.track_id ?? -1]: tracks.filter(
        (t) =>
          t.metadata.stem_of?.parent_track_id !== undefined &&
          t.metadata.stem_of.parent_track_id === parent.metadata.track_id
      ).length
    }),
    {}
  )
  const pendingMetadata: TrackMetadata[] = []

  const errored: ErrorPayload[] = []
  const uploaded: UploadedPayload[] = []
  const published: PublishedPayload[] = []

  console.debug('Waiting for workers')
  const hasUnprocessedTracks = () =>
    published.length + errored.length < tracks.length
  const collectionUploadErrored = () => errored.length > 0 && isCollection
  while (hasUnprocessedTracks() && !collectionUploadErrored()) {
    const { type, payload } = yield* take(responseChannel)
    if (type === 'UPLOADED') {
      uploaded.push(payload)
      const { index, metadata } = payload
      console.debug(`Track ${metadata.title} uploaded`)
      const trackId = metadata.track_id
      const stemCount = pendingStemCount[metadata.track_id]

      if (isCollection || stemCount > 0) {
        // If parent track of stems or part of collection,
        // save the metadata and wait to publish when the last stem (for parent
        // track) or last track (for a collection) is uploaded.
        pendingMetadata[index] = metadata
      } else {
        publishQueue.put({ index, trackId, metadata })
      }

      if (isCollection && uploaded.length === tracks.length) {
        // Publish the collection once all tracks are uploaded
        for (let i = 0; i < pendingMetadata.length; i++) {
          publishQueue.put({
            index: i,
            trackId: pendingMetadata[i].track_id,
            metadata: pendingMetadata[i]
          })
        }
      }
    } else if (type === 'PUBLISHED') {
      published.push(payload)
      const { index, trackId } = payload
      const metadata = tracks[index].metadata
      console.debug(`Track ${metadata.title} published`)
      yield* put(
        updateProgress(index, 'art', { status: ProgressStatus.COMPLETE })
      )
      yield* put(
        updateProgress(index, 'audio', { status: ProgressStatus.COMPLETE })
      )
      const parentTrackId = tracks[index].metadata.stem_of?.parent_track_id
      const parentTrackIndex = tracks.findIndex(
        (t) => t.metadata.track_id === parentTrackId
      )
      if (parentTrackId) {
        if (!isCollection) {
          // Trigger upload for parent if last stem
          pendingStemCount[parentTrackId] -= 1
          if (
            pendingStemCount[parentTrackId] === 0 &&
            pendingMetadata[parentTrackIndex]
          ) {
            console.debug(`Publishing stem parent: ${parentTrackId}`)
            publishQueue.put({
              index: parentTrackIndex,
              trackId: parentTrackId,
              metadata: pendingMetadata[parentTrackIndex]
            })
            delete pendingMetadata[parentTrackIndex]
          }
        }

        yield* put(
          make(Name.STEM_COMPLETE_UPLOAD, {
            id: trackId,
            parent_track_id: parentTrackId,
            category: tracks[index].metadata.stem_of?.category
          })
        )
      } else {
        yield* put(make(Name.TRACK_UPLOAD_SUCCESS, { kind }))
      }
    } else if (type === 'ERROR') {
      const { index, trackId, error, phase } = payload
      // Check to make sure we haven't already errored for this track.
      // This could happen if one of its stems failed.
      if (!errored.find((e) => e.index === index)) {
        errored.push(payload)
      }

      // Error this track
      yield* put(updateProgress(index, 'art', { status: ProgressStatus.ERROR }))
      yield* put(
        updateProgress(index, 'audio', { status: ProgressStatus.ERROR })
      )

      // Error this track's parent
      const metadata = tracks[index].metadata
      const parentTrackId = metadata.stem_of?.parent_track_id
      if (parentTrackId) {
        const parentTrackIndex = tracks.findIndex(
          (t) => t.metadata.track_id === parentTrackId
        )
        responseChannel.put({
          type: 'ERROR',
          payload: {
            index: parentTrackIndex,
            trackId: parentTrackId,
            error: 'Stem failed to upload.',
            phase: 'publish'
          }
        })
      } else {
        yield* put(make(Name.TRACK_UPLOAD_FAILURE, { kind }))
      }

      console.error(
        `Track ${metadata.title} errored in the ${phase} phase:`,
        error
      )

      // Report to sentry
      yield* call(reportToSentry, {
        error: error instanceof Error ? error : new Error(String(error)),
        additionalInfo: {
          trackId,
          track: tracks[index],
          phase,
          kind
        }
      })
    }
  }

  console.debug('Spinnning down workers')
  for (const worker of uploadWorkers) {
    worker.cancel()
  }
  for (const worker of publishWorkers) {
    worker.cancel()
  }
  yield* call(progressChannel.close)
  yield* cancel(actionDispatcherTask)

  // Attempt to delete orphaned stems of failed tracks
  for (const errorPayload of errored) {
    const stemsToDelete = published.filter(
      (p) =>
        tracks[p.index].metadata.stem_of?.parent_track_id ===
        errorPayload.trackId
    )
    if (stemsToDelete.length > 0) {
      console.debug(`Cleaning up ${stemsToDelete.length} orphaned stems`)
      yield* call(
        deleteTracks,
        stemsToDelete.map((t) => t.trackId)
      )
    }
  }

  // Attempt to delete all orphaned collection tracks
  if (isCollection && errored.length > 0) {
    console.debug(`Cleaning up ${published.length} orphaned tracks`)
    yield* call(
      deleteTracks,
      published.map((t) => t.trackId)
    )
    yield* put(make(Name.TRACK_UPLOAD_FAILURE, { kind }))
    throw new Error('Failed to upload tracks for collection')
  }

  console.debug('Finished track uploads')
  return published.sort((a, b) => b.index - a.index).map((p) => p.trackId)
}

function* uploadCollection(
  tracks: UploadTrack[],
  userId: ID,
  collectionMetadata: CollectionValues,
  isAlbum: boolean
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // First upload album art
  yield* call(
    audiusBackendInstance.uploadImage,
    collectionMetadata.artwork?.file as File // It's a blob, but close enough
  )

  // Then upload tracks
  const tracksWithMetadata = tracks.map((track) => {
    const metadata = combineMetadata(track.metadata, collectionMetadata)
    return {
      ...track,
      metadata
    }
  })

  // Due to the channels, etc, the types are wrong - cast them.
  const trackIds = (yield* call(handleUploads, {
    tracks: tracksWithMetadata,
    kind: isAlbum ? 'album' : 'playlist'
  })) as unknown as ID[]

  yield* call(
    recordGatedTracks,
    tracksWithMetadata.map((t) => t.metadata)
  )

  const playlistId = yield* call(getUnclaimedPlaylistId)
  if (playlistId == null) {
    throw new Error('Failed to get playlist ID')
  }

  // Finally, create the playlist
  yield* put(
    confirmerActions.requestConfirmation(
      `${collectionMetadata.playlist_name}_${Date.now()}`,
      function* () {
        console.debug('Creating playlist')
        // Uploaded collections are always public
        const isPrivate = false
        const { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.createPlaylist,
          playlistId,
          collectionMetadata as unknown as CollectionMetadata,
          isAlbum,
          trackIds,
          isPrivate
        )

        if (error) {
          console.debug('Caught an error creating playlist')
          if (playlistId) {
            yield* put(uploadActions.createPlaylistErrorIDExists(error))
            console.debug('Deleting playlist')
            // If we got a playlist ID back, that means we
            // created the playlist but adding tracks to it failed. So we must delete the playlist
            yield* call(audiusBackendInstance.deletePlaylist, playlistId)
            console.debug('Playlist deleted successfully')
          } else {
            // I think this is what we want
            yield put(uploadActions.createPlaylistErrorNoId(error))
          }
          // Throw to trigger the fail callback
          throw new Error('Playlist creation error')
        }

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm playlist creation for playlist id ${playlistId}`
          )
        }

        return (yield* call(audiusBackendInstance.getPlaylists, userId, [
          playlistId
        ]))[0]
      },
      function* (confirmedPlaylist: Collection) {
        yield* put(
          uploadActions.uploadTracksSucceeded(
            confirmedPlaylist.playlist_id,
            [],
            confirmedPlaylist
          )
        )
        const user = yield* select(cacheUsersSelectors.getUser, { id: userId })
        yield* put(
          cacheActions.update(Kind.USERS, [
            {
              id: userId,
              metadata: {
                _collectionIds: (user?._collectionIds ?? []).concat(
                  confirmedPlaylist.playlist_id
                )
              }
            }
          ])
        )

        // Add images to the collection since we're not loading it the traditional way with
        // the `fetchCollections` saga
        confirmedPlaylist = yield* call(reformatCollection, {
          collection: confirmedPlaylist,
          audiusBackendInstance
        })
        const uid = yield* makeUid(
          Kind.COLLECTIONS,
          confirmedPlaylist.playlist_id,
          'account'
        )
        // Create a cache entry and add it to the account so the playlist shows in the left nav
        yield* put(
          cacheActions.add(
            Kind.COLLECTIONS,
            [
              {
                id: confirmedPlaylist.playlist_id,
                uid,
                metadata: confirmedPlaylist
              }
            ],
            /* replace= */ true // forces cache update
          )
        )
        yield* put(
          accountActions.addAccountPlaylist({
            id: confirmedPlaylist.playlist_id,
            name: confirmedPlaylist.playlist_name,
            is_album: confirmedPlaylist.is_album,
            permalink: confirmedPlaylist.permalink!,
            user: {
              id: user!.user_id,
              handle: user!.handle
            }
          })
        )
        yield* put(
          savedPageActions.addLocalCollection({
            collectionId: confirmedPlaylist.playlist_id,
            isAlbum: confirmedPlaylist.is_album,
            category: LibraryCategory.Favorite
          })
        )
        yield* put(
          make(Name.TRACK_UPLOAD_COMPLETE_UPLOAD, {
            count: trackIds.length,
            kind: isAlbum ? 'album' : 'playlist'
          })
        )
        yield* put(cacheActions.setExpired(Kind.USERS, userId))

        // Finally, add to the library
        yield* call(addPlaylistsNotInLibrary)
      },
      function* ({ timeout }) {
        // All other non-timeout errors have
        // been accounted for at this point
        if (timeout) {
          yield* put(uploadActions.createPlaylistPollingTimeout())
        }

        console.error(
          `Create playlist call failed, deleting tracks: ${JSON.stringify(
            trackIds
          )}`
        )
        try {
          yield* all(
            trackIds.map((id) => audiusBackendInstance.deleteTrack(id))
          )
          console.debug('Deleted tracks.')
        } catch (err) {
          console.debug(`Could not delete all tracks: ${err}`)
        }
        yield* put(
          errorActions.handleError({
            name: 'Create Playlist Error',
            message: 'Create playlist call failed',
            shouldRedirect: true
          })
        )
      }
    )
  )
}

function* uploadMultipleTracks(tracks: UploadTrack[]) {
  // Cheating here - getting the track ID early so we can parallelize stems
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const audiusLibs = yield* call([
    audiusBackendInstance,
    audiusBackendInstance.getAudiusLibsTyped
  ])
  const tracksAndStems = tracks.concat(
    tracks.map((t) => t.metadata.stems ?? []).flat()
  )
  const tracksWithIds = yield* all(
    tracksAndStems.map((track) =>
      call(function* () {
        const id = yield* call([
          audiusLibs.Track,
          audiusLibs.Track!.generateTrackId
        ])
        return {
          ...track,
          metadata: {
            ...track.metadata,
            track_id: id
          }
        }
      })
    )
  )

  // Upload tracks and stems parallel together
  const trackIds = yield* call(handleUploads, {
    tracks: tracksWithIds,
    kind: 'tracks'
  })

  yield waitForAccount()
  const account = yield* select(accountSelectors.getAccountUser)

  const newTracks = yield* call(retrieveTracks, {
    trackIds,
    forceRetrieveFromSource: true
  })

  yield* call(adjustUserField, {
    user: account!,
    fieldName: 'track_count',
    delta: newTracks.length
  })

  yield* put(
    uploadActions.uploadTracksSucceeded(trackIds[0], newTracks, newTracks[0])
  )

  yield* put(
    make(Name.TRACK_UPLOAD_COMPLETE_UPLOAD, {
      count: tracksWithIds.length,
      kind: 'tracks'
    })
  )
  yield* call(
    recordGatedTracks,
    tracksWithIds.map((track) => track.metadata)
  )

  // If the hide remixes is turned on, send analytics event
  for (let i = 0; i < tracks.length; i += 1) {
    const track = tracks[i]
    const trackId = trackIds[i]
    if (track.metadata?.field_visibility?.remixes === false) {
      yield* put(
        make(Name.REMIX_HIDE, {
          id: trackId,
          handle: account!.handle
        })
      )
    }
  }

  for (const { metadata: remixTrack } of tracksWithIds) {
    if (
      remixTrack.remix_of !== null &&
      Array.isArray(remixTrack.remix_of?.tracks) &&
      remixTrack.remix_of.tracks.length > 0
    ) {
      yield* call(trackNewRemixEvent, remixTrack)
    }
  }

  yield* put(cacheActions.setExpired(Kind.USERS, account!.user_id))
}

function* uploadTracksAsync(
  action: ReturnType<typeof uploadActions.uploadTracks>
) {
  yield waitForWrite()
  const user = yield* select(accountSelectors.getAccountUser)
  const payload = action.payload
  if (payload.uploadType === undefined) {
    console.error('Unexpected undefined uploadType in upload/sagas.ts')
    return
  }
  yield* put(uploadActions.uploadTracksRequested(payload))

  const kind = (() => {
    switch (payload.uploadType) {
      case UploadType.PLAYLIST:
        return 'playlist'
      case UploadType.ALBUM:
        return 'album'
      case UploadType.INDIVIDUAL_TRACK:
      case UploadType.INDIVIDUAL_TRACKS:
      default:
        return 'tracks'
    }
  })()

  const recordEvent = make(Name.TRACK_UPLOAD_START_UPLOADING, {
    count: payload.tracks.length,
    kind
  })
  yield* put(recordEvent)
  const tracks = payload.tracks.map((t) => ({
    ...t,
    metadata: yield* call(processTrackForUpload, t)
  }))

  // Upload content.
  const isAlbum = payload.uploadType === UploadType.ALBUM
  if (
    payload.uploadType === UploadType.PLAYLIST ||
    payload.uploadType === UploadType.ALBUM
  ) {
    yield* uploadCollection(tracks, user!.user_id, payload.metadata, isAlbum)
  } else {
    yield* call(uploadMultipleTracks, tracks)
  }
}

function* watchUploadTracks() {
  yield* takeLatest(uploadActions.UPLOAD_TRACKS, uploadTracksAsync)
}

export default function sagas() {
  return [watchUploadTracks]
}
