import {
  Collection,
  CollectionMetadata,
  ID,
  Kind,
  Name,
  StemUploadWithFile
} from '@audius/common/models'
import { CollectionValues } from '@audius/common/schemas'
import {
  TrackMetadataForUpload,
  LibraryCategory,
  ProgressStatus,
  TrackForUpload,
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
import type { TrackMetadata, UploadTrackMetadata } from '@audius/sdk/dist/utils'
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
import { prepareStemsForUpload } from 'pages/upload-page/store/utils/stems'
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

const MAX_CONCURRENT_UPLOADS = 4
const MAX_CONCURRENT_REGISTRATIONS = 4
const MAX_CONCURRENT_TRACK_SIZE_BYTES = 40 /* MB */ * 1024 * 1024

/**
 * Convert the track metadata for upload to what libs expects.
 * Only thing that needs to be adjusted is preview start seconds is non-optional, evidently?
 */
const toUploadTrackMetadata = (
  trackMetadata: TrackMetadataForUpload
): UploadTrackMetadata => ({
  ...trackMetadata,
  preview_start_seconds: trackMetadata.preview_start_seconds ?? null
})

/**
 * Combines the metadata for a track and a collection (playlist or album),
 * taking the metadata from the playlist when the track is missing it.
 */
const combineMetadata = (
  trackMetadata: TrackMetadataForUpload,
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

/**
 * Creates a callback that runs on upload progress in libs/sdk and
 * reports that progress to the store via actions.
 */
const makeOnProgress = (
  trackIndex: number,
  stemIndex: number | null,
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
        updateProgress({
          trackIndex,
          stemIndex,
          key,
          progress: {
            loaded: upload?.loaded,
            total: upload?.total,
            transcode: transcode?.decimal,
            status:
              !upload || upload.loaded !== upload.total
                ? ProgressStatus.UPLOADING
                : ProgressStatus.PROCESSING
          }
        })
      )
    } catch {
      // Sometimes this can fail repeatedly in quick succession (root cause TBD)
      // it doesn't seem to affect the CX so catch to avoid spamming sentry
    }
  }
}

/**
 * Deletes a list of tracks by track IDs.
 * Used in cleaning up orphaned stems or tracks of a collection.
 */
function* deleteTracks(trackIds: ID[]) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const libs = yield* call(audiusBackendInstance.getAudiusLibsTyped)

  yield* all(
    trackIds.map((id) => call([libs.Track, libs.Track!.deleteTrack], id))
  )
}

/**
 * Calculates the number of workers to process upload requests.
 * Ensures we don't have absurd amounts of data going over the wire at once.
 */
const getNumUploadWorkers = (trackFiles: File[]) => {
  const largestFileSize = Math.max(...trackFiles.map((t) => t.size))

  // Divide it out so that we never hit > MAX_CONCURRENT_TRACK_SIZE_BYTES in flight.
  // e.g. so if we have 40 MB max upload and max track size of 15MB,
  // floor(40/15) => 2 workers
  const numWorkers = Math.floor(
    MAX_CONCURRENT_TRACK_SIZE_BYTES / largestFileSize
  )
  const maxWorkers = Math.min(MAX_CONCURRENT_UPLOADS, trackFiles.length)

  // Clamp between 1 and `maxWorkers`
  return Math.min(Math.max(numWorkers, 1), maxWorkers)
}

/**
 * Worker that handles upload requests.
 * @param uploadQueue The queue of upload requests to pull from.
 * @param progressChannel The channel to report progress actions to.
 * @param responseChannel The channel to report the outcome to.
 */
function* uploadWorker(
  uploadQueue: Channel<UploadTask>,
  progressChannel: Channel<ProgressAction>,
  responseChannel: Channel<UploadTrackResponse>
) {
  while (true) {
    const task = yield* take(uploadQueue)
    const { trackIndex, stemIndex, track } = task
    try {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      const libs = yield* call(audiusBackendInstance.getAudiusLibsTyped)
      const metadata = toUploadTrackMetadata(track.metadata)

      const updatedMetadata = yield* call(
        [libs.Track, libs.Track!.uploadTrackV2],
        track.file as File,
        (track.metadata.artwork?.file ?? null) as File | null,
        metadata,
        makeOnProgress(trackIndex, stemIndex, progressChannel)
      )
      yield* put(responseChannel, {
        type: 'UPLOADED',
        payload: { trackIndex, stemIndex, metadata: updatedMetadata }
      })
    } catch (e) {
      yield* put(responseChannel, {
        type: 'ERROR',
        payload: { phase: 'upload', trackIndex, stemIndex, error: e }
      })
    }
  }
}

/**
 * Worker that handles the entity manager writes.
 * @param publishQueue The queue of publish requests
 * @param responseChannel The channel to report the outcome to.
 */
function* publishWorker(
  publishQueue: Channel<PublishTask>,
  responseChannel: Channel<UploadTrackResponse>
) {
  while (true) {
    const task = yield* take(publishQueue)
    const { trackIndex, stemIndex, trackId: presetTrackId, metadata } = task
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
        payload: {
          trackIndex,
          stemIndex,
          trackId: updatedTrackId,
          metadata: { ...metadata, track_id: updatedTrackId }
        }
      })
    } catch (e) {
      yield* put(responseChannel, {
        type: 'ERROR',
        payload: { phase: 'publish', trackIndex, stemIndex, error: e }
      })
    }
  }
}

/** Queued task for the upload worker. */
type UploadTask = {
  trackIndex: number
  stemIndex: number | null
  track: TrackForUpload
}

/** Upload worker success response payload */
type UploadedPayload = {
  trackIndex: number
  stemIndex: number | null
  metadata: TrackMetadata
}

/** Queued task for the publish worker. */
type PublishTask = {
  trackIndex: number
  stemIndex: number | null
  trackId: ID
  metadata: TrackMetadata
}

/** Publish worker success response payload */
type PublishedPayload = {
  trackIndex: number
  stemIndex: number | null
  trackId: ID
  metadata: TrackMetadata
}

/** Error response payload (from either worker). */
type ErrorPayload = {
  trackIndex: number
  stemIndex: number | null
  trackId?: ID
  phase: 'upload' | 'publish'
  error: unknown
}

/** All possible response payloads from workers. */
type UploadTrackResponse =
  | { type: 'UPLOADED'; payload: UploadedPayload }
  | { type: 'PUBLISHED'; payload: PublishedPayload }
  | { type: 'ERROR'; payload: ErrorPayload }

/**
 * Spins up workers to handle uploading of tracks and their stems in parallel.
 * 
 * Waits to publish parent tracks until their stems successfully upload.
 * If a stem fails, marks the parent as failed and unpublishes the other stems.
 * 
 * Waits to publish collection tracks until all other tracks successfully upload.
 * If a track from a collection fails, marks the collection as failed and
 * unpublishes all other collection tracks.
 * 
 * Also called from the edit track flow for uploading stems to existing tracks.
 * Those tracks must be uploaded as "tracks" since their parent is already
 * uploaded, rather than sending their parent with stems attached.
 */
export function* handleUploads({
  tracks,
  kind
}: {
  tracks: TrackForUpload[]
  kind: 'album' | 'playlist' | 'tracks' | 'stems'
}) {
  const isCollection = kind === 'album' || kind === 'playlist'
  const numUploadWorkers = getNumUploadWorkers(tracks.map((t) => t.file as File).concat(
    tracks.map((t) => t.metadata.stems?.map((s) => s.file) ?? []).flat()
  ))
  const numPublishWorkers = MAX_CONCURRENT_REGISTRATIONS
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

  const stems: StemUploadWithFile[] = []
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i]
    uploadQueue.put({ trackIndex: i, stemIndex: null, track })
    const trackStems = prepareStemsForUpload(
      track.metadata.stems ?? [],
      track.metadata.track_id
    )
    for (let j = 0; j < trackStems.length; j++) {
      const stem = trackStems[j]
      uploadQueue.put({ trackIndex: i, stemIndex: j, track: stem })
      stems.push(stem)
    }
  }

  const pendingStemCount = tracks.reduce<Record<ID, number>>(
    (prev, parent) => ({
      ...prev,
      [parent.metadata.track_id]: parent.metadata.stems?.length ?? 0
    }),
    {}
  )

  const pendingMetadata: TrackMetadata[] = []

  const errored: ErrorPayload[] = []
  const uploaded: UploadedPayload[] = []
  const published: PublishedPayload[] = []

  console.debug('Waiting for workers')
  const hasUnprocessedTracks = () =>
    published.length + errored.length < tracks.length + stems.length
  const collectionUploadErrored = () => errored.length > 0 && isCollection
  while (hasUnprocessedTracks() && !collectionUploadErrored()) {
    const { type, payload } = yield* take(responseChannel)
    if (type === 'UPLOADED') {
      uploaded.push(payload)
      const { trackIndex, stemIndex, metadata } = payload
      console.debug(
        `${stemIndex === null && kind !== 'stems' ? 'Track' : 'Stem'} ${metadata.title} uploaded`,
        { trackIndex, stemIndex }
      )
      const trackId = metadata.track_id
      const stemCount = pendingStemCount[metadata.track_id]

      if (isCollection || stemCount > 0) {
        // If parent track of stems or part of collection,
        // save the metadata and wait to publish when the last stem (for parent
        // track) or last track (for a collection) is uploaded.
        pendingMetadata[trackIndex] = metadata
      } else {
        publishQueue.put({ trackIndex, stemIndex, trackId, metadata })
      }

      if (isCollection && uploaded.length === tracks.length) {
        // Publish the collection once all tracks are uploaded
        for (let i = 0; i < pendingMetadata.length; i++) {
          publishQueue.put({
            trackIndex: i,
            stemIndex: null,
            trackId: pendingMetadata[i].track_id,
            metadata: pendingMetadata[i]
          })
        }
      }
    } else if (type === 'PUBLISHED') {
      published.push(payload)
      const { trackIndex, stemIndex, trackId, metadata } = payload
      console.debug(
        `${stemIndex === null && kind !== 'stems' ? 'Track' : 'Stem'} ${metadata.title} published`
      )
      yield* put(
        updateProgress({
          trackIndex,
          stemIndex,
          key: 'art',
          progress: { status: ProgressStatus.COMPLETE }
        })
      )
      yield* put(
        updateProgress({
          trackIndex,
          stemIndex,
          key: 'audio',
          progress: { status: ProgressStatus.COMPLETE }
        })
      )
      const parentTrackId = tracks[trackIndex].metadata.track_id
      if (stemIndex !== null) {
        if (!isCollection) {
          // Trigger upload for parent if last stem
          pendingStemCount[parentTrackId] -= 1
          if (
            pendingStemCount[parentTrackId] === 0 &&
            pendingMetadata[trackIndex]
          ) {
            console.debug(
              `Stems finished for ${parentTrackId}, uploading parent: ${pendingMetadata[trackIndex].title}`
            )
            publishQueue.put({
              trackIndex,
              stemIndex: null,
              trackId: parentTrackId,
              metadata: pendingMetadata[trackIndex]
            })
            delete pendingMetadata[trackIndex]
          }
        }

        yield* put(
          make(Name.STEM_COMPLETE_UPLOAD, {
            id: trackId,
            parent_track_id: parentTrackId,
            category: tracks[trackIndex].metadata.stems?.[stemIndex].category
          })
        )
      } else {
        yield* put(make(Name.TRACK_UPLOAD_SUCCESS, { kind }))
      }
    } else if (type === 'ERROR') {
      const { trackIndex, stemIndex, trackId, error, phase } = payload
      // Check to make sure we haven't already errored for this track.
      // This could happen if one of its stems failed.
      if (
        !errored.find(
          (e) => e.trackIndex === trackIndex && e.stemIndex === stemIndex
        )
      ) {
        errored.push(payload)
      }

      // Error this track
      yield* put(
        updateProgress({
          trackIndex,
          stemIndex,
          key: 'art',
          progress: { status: ProgressStatus.ERROR }
        })
      )
      yield* put(
        updateProgress({
          trackIndex,
          stemIndex,
          key: 'audio',
          progress: { status: ProgressStatus.ERROR }
        })
      )

      // Error this track's parent
      if (stemIndex !== null) {
        responseChannel.put({
          type: 'ERROR',
          payload: {
            trackIndex,
            stemIndex: null,
            trackId: tracks[trackIndex].metadata.track_id,
            error: 'Stem failed to upload.',
            phase: 'publish'
          }
        })
      } else {
        yield* put(make(Name.TRACK_UPLOAD_FAILURE, { kind }))
      }

      console.error(`Track ${trackId} errored in the ${phase} phase:`, error)

      // Report to sentry
      yield* call(reportToSentry, {
        error: error instanceof Error ? error : new Error(String(error)),
        additionalInfo: {
          trackId,
          track: tracks[trackIndex],
          stemIndex,
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
      (p) => tracks[p.trackIndex].metadata.track_id === errorPayload.trackId
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
  return published
    .filter((t) => t.stemIndex === null)
    .sort((a, b) => b.trackIndex - a.trackIndex)
    .map((p) => p.trackId)
}

/**
 * Uploads a collection.
 * @param tracks The tracks of the collection
 * @param userId The user uploading
 * @param collectionMetadata misnomer - actually just the values from the form fields
 * @param isAlbum Whether the collection is an album or not.
 */
function* uploadCollection(
  tracks: TrackForUpload[],
  userId: ID,
  collectionMetadata: CollectionValues,
  isAlbum: boolean
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // First upload album art
  yield* call(
    audiusBackendInstance.uploadImage,
    collectionMetadata.artwork?.file as File
  )

  // Propagate the collection metadata to the tracks
  const tracksWithMetadata = tracks.map((track) => {
    const metadata = combineMetadata(track.metadata, collectionMetadata)
    return {
      ...track,
      metadata
    }
  })

  // Upload the tracks
  const trackIds = yield* call(handleUploads, {
    tracks: tracksWithMetadata,
    kind: isAlbum ? 'album' : 'playlist'
  })

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

/**
 * Uploads any number of standalone tracks.
 * @param tracks the tracks to upload
 */
function* uploadMultipleTracks(tracks: TrackForUpload[]) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const audiusLibs = yield* call([
    audiusBackendInstance,
    audiusBackendInstance.getAudiusLibsTyped
  ])

  // Get the IDs ahead of time, so that stems can be associated.
  const tracksWithIds = yield* all(
    tracks.map((track) =>
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

  // Get true track metadatas back
  const newTracks = yield* call(retrieveTracks, {
    trackIds,
    forceRetrieveFromSource: true
  })

  // Make sure track count changes
  yield* call(adjustUserField, {
    user: account!,
    fieldName: 'track_count',
    delta: newTracks.length
  })

  yield* put(
    uploadActions.uploadTracksSucceeded(
      newTracks[0].track_id,
      newTracks,
      newTracks[0]
    )
  )

  yield* put(
    make(Name.TRACK_UPLOAD_COMPLETE_UPLOAD, {
      count: newTracks.length,
      kind: 'tracks'
    })
  )

  // Send analytics for any gated content
  yield* call(
    recordGatedTracks,
    tracksWithIds.map((track) => track.metadata)
  )

  // If the hide remixes is turned on, send analytics event
  for (let i = 0; i < newTracks.length; i += 1) {
    const track = newTracks[i]
    if (track.field_visibility?.remixes === false) {
      yield* put(
        make(Name.REMIX_HIDE, {
          id: track.track_id,
          handle: account!.handle
        })
      )
    }
  }

  // Send analytics for any remixes
  for (const remixTrack of newTracks) {
    if (
      remixTrack.remix_of !== null &&
      Array.isArray(remixTrack.remix_of?.tracks) &&
      remixTrack.remix_of.tracks.length > 0
    ) {
      yield* call(trackNewRemixEvent, remixTrack)
    }
  }

  // Bust the cache so we refetch the user
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
  const tracks = payload.tracks
  for (const trackUpload of tracks) {
    trackUpload.metadata = yield* call(
      processTrackForUpload<TrackMetadataForUpload>,
      trackUpload.metadata
    )
  }

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
