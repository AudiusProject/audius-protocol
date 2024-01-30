import {
  Name,
  DefaultSizes,
  Kind,
  makeKindId,
  squashNewLines,
  accountSelectors,
  accountActions,
  cacheCollectionsSelectors,
  cacheCollectionsActions as collectionActions,
  PlaylistOperations,
  cacheUsersSelectors,
  cacheActions,
  getContext,
  toastActions,
  updatePlaylistArtwork,
  cacheTracksSelectors,
  removeNullable,
  confirmerActions,
  LibraryCategory,
  confirmTransaction,
  reformatCollection,
  savedPageActions,
  ID,
  PlaylistContents,
  Collection,
  UserCollectionMetadata,
  PlaylistTrackId,
  TransactionReceipt,
  User,
  Entry,
  SubscriptionInfo,
  UID,
  UserFollowees,
  FolloweeRepost
} from '@audius/common'
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import watchTrackErrors from 'common/store/cache/collections/errorSagas'
import { fetchUsers } from 'common/store/cache/users/sagas'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  addPlaylistsNotInLibrary,
  removePlaylistFromLibrary
} from 'common/store/playlist-library/sagas'
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchAddTrackToPlaylist } from './addTrackToPlaylistSaga'
import { confirmOrderPlaylist } from './confirmOrderPlaylist'
import { createPlaylistSaga } from './createPlaylistSaga'
import { fixInvalidTracksInPlaylist } from './fixInvalidTracksInPlaylist'
import { optimisticUpdateCollection } from './utils/optimisticUpdateCollection'
import { retrieveCollection } from './utils/retrieveCollections'

const { manualClearToast, toast } = toastActions
const { getUser } = cacheUsersSelectors
const { getCollection, getCollectionTracks } = cacheCollectionsSelectors
const { getTrack } = cacheTracksSelectors
const { getAccountUser, getUserId } = accountSelectors

const messages = {
  editToast: 'Changes saved!',
  removingTrack: 'Removing track...',
  removedTrack: 'Removed track'
}

/** Counts instances of trackId in a playlist. */
const countTrackIds = (
  playlistContents: PlaylistContents | undefined,
  trackId: ID
) => {
  return playlistContents
    ? playlistContents.track_ids
        .map((t) => t.track)
        .reduce((acc: number, t) => {
          if (t === trackId) acc += 1
          return acc
        }, 0)
    : 0
}

/** EDIT PLAYLIST */

function* watchEditPlaylist() {
  yield* takeLatest(collectionActions.EDIT_PLAYLIST, editPlaylistAsync)
}

function* editPlaylistAsync(
  action: ReturnType<typeof collectionActions.editPlaylist>
) {
  const { playlistId, formFields } = action
  const userId = yield* call(ensureLoggedIn)
  yield* waitForWrite()

  const audiusBackend = yield* getContext('audiusBackendInstance')
  const { generatePlaylistArtwork } = yield* getContext('imageUtils')

  formFields.description = squashNewLines(formFields.description)

  // Updated the stored account playlist shortcut
  yield* put(
    accountActions.renameAccountPlaylist({
      collectionId: playlistId,
      name: formFields.playlist_name
    })
  )

  let playlist: Collection = { ...formFields }
  const playlistTracks = yield* select(getCollectionTracks, { id: playlistId })
  const updatedTracks = yield* select((state) => {
    return formFields.playlist_contents.track_ids
      .map(({ track }) => getTrack(state, { id: track }))
      .filter(removeNullable)
  })

  // Optimistic update #1 to quickly update metadata and track lineup
  yield* call(optimisticUpdateCollection, playlist)

  playlist = yield* call(
    updatePlaylistArtwork,
    playlist,
    playlistTracks!,
    { updated: updatedTracks },
    { audiusBackend, generateImage: generatePlaylistArtwork }
  )

  // Optimistic update #2 to update the artwork
  yield* call(optimisticUpdateCollection, playlist)

  yield* call(confirmEditPlaylist, playlistId, userId, playlist)
  yield* put(collectionActions.editPlaylistSucceeded())
  yield* put(toast({ content: messages.editToast }))
}

function* confirmEditPlaylist(
  playlistId: ID,
  userId: ID,
  formFields: Collection
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (_confirmedPlaylistId: ID) {
        const { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.updatePlaylist,
          formFields
        )

        if (error) throw error

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm playlist edition for playlist id ${playlistId}`
          )
        }

        return (yield* call(audiusBackendInstance.getPlaylists, userId, [
          playlistId
        ]))[0]
      },
      function* (confirmedPlaylist: Collection) {
        // Update the cached collection so it no longer contains image upload artifacts
        yield* put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: {
                ...reformatCollection({
                  collection: confirmedPlaylist,
                  audiusBackendInstance
                }),
                artwork: {}
              }
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        yield* put(
          collectionActions.editPlaylistFailed(
            error,
            { playlistId, userId, formFields },
            { error, timeout }
          )
        )
      },
      (result: Collection) =>
        result.playlist_id ? result.playlist_id : playlistId
    )
  )
}

/** REMOVE TRACK FROM PLAYLIST */

function* watchRemoveTrackFromPlaylist() {
  yield* takeEvery(
    collectionActions.REMOVE_TRACK_FROM_PLAYLIST,
    removeTrackFromPlaylistAsync
  )
}

function* removeTrackFromPlaylistAsync(
  action: ReturnType<typeof collectionActions.removeTrackFromPlaylist>
) {
  const { playlistId, trackId, timestamp } = action
  yield* waitForWrite()
  const userId = yield* call(ensureLoggedIn)
  const audiusBackend = yield* getContext('audiusBackendInstance')
  const { generatePlaylistArtwork } = yield* getContext('imageUtils')

  let playlist = yield* select(getCollection, { id: playlistId })
  const playlistTracks = yield* select(getCollectionTracks, { id: playlistId })
  const removedTrack = yield* select(getTrack, { id: trackId })

  playlist = yield* call(
    updatePlaylistArtwork,
    playlist!,
    playlistTracks!,
    {
      removed: removedTrack!
    },
    { audiusBackend, generateImage: generatePlaylistArtwork }
  )

  // Find the index of the track based on the track's id and timestamp
  const index = playlist.playlist_contents.track_ids.findIndex((t) => {
    if (t.track !== trackId) return false

    return t.metadata_time === timestamp || t.time === timestamp
  })
  if (index === -1) {
    console.error('Could not find the index of to-be-deleted track')
    return
  }

  const track = playlist.playlist_contents.track_ids[index]
  playlist.playlist_contents.track_ids.splice(index, 1)
  const count = countTrackIds(playlist.playlist_contents, trackId)

  yield* put(
    toast({
      content: messages.removingTrack,
      key: `remove-track-${trackId}`
    })
  )

  yield* call(
    confirmRemoveTrackFromPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    track.time,
    count,
    playlist
  )
  yield* call(optimisticUpdateCollection, {
    ...playlist,
    track_count: count
  })
}

function* confirmRemoveTrackFromPlaylist(
  userId: ID,
  playlistId: ID,
  trackId: ID,
  timestamp: number,
  count: number,
  playlist: Collection
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId: ID) {
        // NOTE: In an attempt to fix playlists in a corrupted state, only attempt the delete playlist track once,
        // if it fails, check if the playlist is in a corrupted state and if so fix it before re-attempting to delete track from playlist
        let { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.deletePlaylistTrack,
          playlist
        )
        if (error) {
          const {
            error: tracksInPlaylistError,
            isValid,
            invalidTrackIds
          } = yield* call(
            audiusBackendInstance.validateTracksInPlaylist,
            confirmedPlaylistId
          )
          if (tracksInPlaylistError) throw tracksInPlaylistError
          if (!isValid) {
            const updatedPlaylist = yield* fixInvalidTracksInPlaylist(
              confirmedPlaylistId,
              invalidTrackIds
            )
            const isTrackRemoved =
              countTrackIds(updatedPlaylist?.playlist_contents, trackId) <=
              count
            if (isTrackRemoved) return updatedPlaylist
          }
          const response = yield* call(
            audiusBackendInstance.deletePlaylistTrack,
            playlist
          )
          if (response.error) throw response.error

          blockHash = response.blockHash
          blockNumber = response.blockNumber
        }

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm remove playlist track for playlist id ${playlistId} and track id ${trackId}`
          )
        }
        return confirmedPlaylistId
      },
      function* (confirmedPlaylistId: ID) {
        const [confirmedPlaylist] = yield* call(retrieveCollection, {
          playlistId: confirmedPlaylistId
        })
        yield* put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
        yield* put(manualClearToast({ key: `remove-track-${trackId}` }))
        yield* put(
          toast({
            content: messages.removedTrack
          })
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield* put(
          collectionActions.removeTrackFromPlaylistFailed(
            error,
            { userId, playlistId, trackId, timestamp, count },
            { error, timeout }
          )
        )
      },
      (result: Collection) =>
        result.playlist_id ? result.playlist_id : playlistId,
      undefined,
      {
        operationId: PlaylistOperations.REMOVE_TRACK,
        parallelizable: false,
        useOnlyLastSuccessCall: false,
        squashable: true
      }
    )
  )
}

/** ORDER PLAYLIST */

function* watchOrderPlaylist() {
  yield* takeEvery(collectionActions.ORDER_PLAYLIST, orderPlaylistAsync)
}

function* orderPlaylistAsync(
  action: ReturnType<typeof collectionActions.orderPlaylist>
) {
  const { playlistId, trackIdsAndTimes } = action
  yield* waitForWrite()
  const userId = yield* call(ensureLoggedIn)
  const audiusBackend = yield* getContext('audiusBackendInstance')
  const { generatePlaylistArtwork } = yield* getContext('imageUtils')

  const playlist = yield* select(getCollection, { id: playlistId })
  const tracks = yield* select(getCollectionTracks, { id: playlistId })

  const trackIds = trackIdsAndTimes.map(({ id }) => id)

  const orderedTracks = trackIds.map(
    (trackId) => tracks!.find((track) => track.track_id === trackId)!
  )

  const updatedPlaylist = yield* call(
    updatePlaylistArtwork,
    playlist!,
    tracks!,
    { reordered: orderedTracks },
    { audiusBackend, generateImage: generatePlaylistArtwork }
  )

  updatedPlaylist.playlist_contents.track_ids = trackIdsAndTimes.map(
    ({ id, time }) => ({ track: id, time })
  )

  yield* call(
    confirmOrderPlaylist,
    userId,
    playlistId,
    trackIds,
    updatedPlaylist
  )

  yield* call(optimisticUpdateCollection, updatedPlaylist)
}

/** PUBLISH PLAYLIST */

function* watchPublishPlaylist() {
  yield* takeEvery(collectionActions.PUBLISH_PLAYLIST, publishPlaylistAsync)
}

function* publishPlaylistAsync(
  action: ReturnType<typeof collectionActions.publishPlaylist>
) {
  yield* waitForWrite()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    return
  }

  const event = make(Name.PLAYLIST_MAKE_PUBLIC, { id: action.playlistId })
  yield* put(event)

  const playlist = yield* select(getCollection, { id: action.playlistId })
  if (!playlist) return
  playlist._is_publishing = true
  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: { _is_publishing: true }
      }
    ])
  )

  yield* call(
    confirmPublishPlaylist,
    userId,
    action.playlistId,
    playlist,
    action.dismissToastKey
  )
}

function* confirmPublishPlaylist(
  userId: ID,
  playlistId: ID,
  playlist: Collection,
  dismissToastKey?: string
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (_confirmedPlaylistId: ID) {
        const { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.publishPlaylist,
          playlist
        )
        if (error) throw error

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm publish playlist for playlist id ${playlistId}`
          )
        }
        return (yield* call(audiusBackendInstance.getPlaylists, userId, [
          playlistId
        ]))[0]
      },
      function* (confirmedPlaylist: Collection) {
        confirmedPlaylist.is_private = false
        confirmedPlaylist._is_publishing = false
        yield* put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
        if (dismissToastKey) {
          yield* put(manualClearToast({ key: dismissToastKey }))
        }

        yield* put(toast({ content: 'Your playlist is now public!' }))
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield* put(
          collectionActions.publishPlaylistFailed(
            error,
            { userId, playlistId },
            { error, timeout }
          )
        )
      },
      (result: Collection) =>
        result.playlist_id ? result.playlist_id : playlistId
    )
  )
}

/** DELETE PLAYLIST */

function* watchDeletePlaylist() {
  yield* takeEvery(collectionActions.DELETE_PLAYLIST, deletePlaylistAsync)
}

function* deletePlaylistAsync(
  action: ReturnType<typeof collectionActions.deletePlaylist>
) {
  yield* waitForWrite()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    return
  }

  // Depending on whether the collection is an album
  // or playlist, we should either delete all the tracks
  // or just delete the collection.
  const collection = yield* select(getCollection, { id: action.playlistId })
  if (!collection) return

  const isAlbum = collection.is_album
  if (isAlbum) {
    const trackIds = collection.playlist_contents.track_ids

    const event = make(Name.DELETE, { kind: 'album', id: action.playlistId })
    yield* put(event)
    confirmDeleteAlbum(action.playlistId, trackIds, userId)
    yield* call(confirmDeleteAlbum, action.playlistId, trackIds, userId)
  } else {
    const event = make(Name.DELETE, { kind: 'playlist', id: action.playlistId })
    yield* put(event)

    // Preemptively mark the playlist as deleted.
    // It's possible there are other transactions confirming
    // for this playlist, which prevent the delete confirmation
    // from running immediately, which would leave
    // the playlist visible before it runs.
    yield* put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: action.playlistId,
          metadata: { _marked_deleted: true }
        }
      ])
    )
    yield* call(confirmDeletePlaylist, userId, action.playlistId)
  }

  const user = yield* select(getUser, { id: userId })
  if (!user) return
  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: {
          _collectionIds: (user._collectionIds || []).filter(
            (cId) => cId !== action.playlistId
          )
        }
      }
    ])
  )
}

function* confirmDeleteAlbum(
  playlistId: ID,
  trackIds: PlaylistTrackId[],
  userId: ID
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),

      // we don't have to worry about passing in a confirmed ID
      // here because unlike deleting a playlist, when
      // deleting an album we know it's persisted to chain already
      // thus we have it's permanent ID.
      function* () {
        // Optimistically mark everything as deleted
        yield* all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: playlistId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            cacheActions.update(
              Kind.TRACKS,
              trackIds.map((t) => ({
                id: t.track,
                metadata: { _marked_deleted: true }
              }))
            )
          ),
          put(
            accountActions.removeAccountPlaylist({ collectionId: playlistId })
          ),
          put(
            savedPageActions.removeLocalCollection({
              collectionId: playlistId,
              isAlbum: true,
              category: LibraryCategory.Favorite
            })
          )
        ])

        const { blockHash, blockNumber, error } = (yield* call(
          audiusBackendInstance.deleteAlbum,
          playlistId,
          trackIds
        )) as TransactionReceipt & { error?: Error }
        if (error) throw error

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(`Could not confirm delete album for id ${playlistId}`)
        }
        return playlistId
      },
      function* () {
        console.debug(`Successfully deleted album ${playlistId}`)
        yield* put(cacheActions.remove(Kind.COLLECTIONS, [playlistId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete album ${playlistId}`)
        // Need to revert the deletes now
        const [playlist, user] = yield* all([
          select(getCollection, { id: playlistId }),
          select(getAccountUser)
        ]) as unknown as [Collection, UserCollectionMetadata]
        yield* all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: playlistId,
                metadata: { _marked_deleted: false }
              }
            ])
          ),
          put(
            cacheActions.update(
              Kind.TRACKS,
              trackIds.map((t) => ({
                id: t.track,
                metadata: { _marked_deleted: false }
              }))
            )
          ),
          put(
            accountActions.addAccountPlaylist({
              id: playlist.playlist_id,
              name: playlist.playlist_name,
              is_album: playlist.is_album,
              user: { id: user.user_id, handle: user.handle },
              permalink: playlist.permalink
            })
          ),
          put(
            savedPageActions.addLocalCollection({
              collectionId: playlist.playlist_id,
              isAlbum: playlist.is_album,
              category: LibraryCategory.Favorite
            })
          )
        ])
        yield* put(
          collectionActions.deletePlaylistFailed(
            error,
            { playlistId, trackIds, userId },
            { error, timeout }
          )
        )
      }
    )
  )
}

function* confirmDeletePlaylist(userId: ID, playlistId: ID) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId: ID) {
        // Optimistically mark playlist as removed
        yield* all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: playlistId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            accountActions.removeAccountPlaylist({ collectionId: playlistId })
          ),
          put(
            savedPageActions.removeLocalCollection({
              collectionId: playlistId,
              isAlbum: false,
              category: LibraryCategory.Favorite
            })
          )
        ])

        yield* call(removePlaylistFromLibrary, playlistId)

        const { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.deletePlaylist,
          playlistId
        )
        if (error) throw error

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete playlist track for playlist id ${playlistId}`
          )
        }
        return playlistId
      },
      function* () {
        console.debug(`Successfully deleted playlist ${playlistId}`)
        yield* put(cacheActions.remove(Kind.COLLECTIONS, [playlistId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete playlist ${playlistId}`)
        const [playlist, user] = yield* all([
          select(getCollection, { id: playlistId }),
          select(getAccountUser)
        ]) as unknown as [Collection, User]
        yield* all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: playlistId,
                metadata: { _marked_deleted: false }
              }
            ])
          ),
          put(
            accountActions.addAccountPlaylist({
              id: playlist.playlist_id,
              name: playlist.playlist_name,
              is_album: playlist.is_album,
              user: { id: user.user_id, handle: user.handle },
              permalink: playlist.permalink
            })
          ),
          put(
            savedPageActions.addLocalCollection({
              collectionId: playlist.playlist_id,
              isAlbum: playlist.is_album,
              category: LibraryCategory.Favorite
            })
          )
        ])
        yield* call(addPlaylistsNotInLibrary)
        yield* put(
          collectionActions.deletePlaylistFailed(
            error,
            { playlistId, userId },
            { error, timeout }
          )
        )
      },
      (result: Collection) =>
        result.playlist_id ? result.playlist_id : playlistId
    )
  )
}

function* fetchRepostInfo(entries: Entry<Collection>[]) {
  const userIds: ID[] = []
  entries.forEach((entry) => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach((repost) =>
        userIds.push(repost.user_id)
      )
    }
  })
  if (userIds.length > 0) {
    const { entries: users, uids } = yield* call(fetchUsers, userIds)

    const updates: UserFollowees[] = []
    const subscriptions: SubscriptionInfo[] = []
    entries.forEach((entry) => {
      const followeeRepostUsers: {
        id: ID
        metadata: { _followees: FolloweeRepost[] }
      } = { id: entry.id, metadata: { _followees: [] } }
      const subscriptionUids: UID[] = []
      entry.metadata.followee_reposts.forEach((repost) => {
        followeeRepostUsers.metadata._followees.push({
          ...repost,
          ...users[repost.user_id]
        })
        subscriptionUids.push(uids[repost.user_id])
      })
      updates.push(followeeRepostUsers)
      if (subscriptionUids.length > 0) {
        subscriptions.concat(
          subscriptionUids.map((uid) => ({
            id: entry.id,
            kind: Kind.USERS,
            uid
          }))
        )
      }
    })

    yield* put(cacheActions.update(Kind.COLLECTIONS, updates, subscriptions))
  }
}

function* watchAdd() {
  yield* takeEvery(
    cacheActions.ADD_SUCCEEDED,
    function* (action: ReturnType<typeof cacheActions.addSucceeded>) {
      if (action.kind === Kind.COLLECTIONS) {
        yield* fork(fetchRepostInfo, action.entries as Entry<Collection>[])
      }
    }
  )
}

function* watchFetchCoverArt() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const inProgress = new Set()
  yield* takeEvery(
    collectionActions.FETCH_COVER_ART,
    function* ({
      collectionId,
      size
    }: ReturnType<typeof collectionActions.fetchCoverArt>) {
      // Unique on id and size
      const key = `${collectionId}-${size}`
      if (inProgress.has(key)) return
      inProgress.add(key)

      try {
        const collection: Collection | null = yield* select(getCollection, {
          id: collectionId
        })
        if (
          !collection ||
          (!collection.cover_art_sizes && !collection.cover_art)
        )
          return

        const multihash = collection.cover_art_sizes || collection.cover_art
        const coverArtSize =
          multihash === collection.cover_art_sizes ? size : undefined

        const url = yield* call(
          audiusBackendInstance.getImageUrl,
          multihash,
          coverArtSize,
          collection.cover_art_cids
        )
        collection._cover_art_sizes = {
          ...collection._cover_art_sizes,
          [coverArtSize || DefaultSizes.OVERRIDE]: url
        }
        yield* put(
          cacheActions.update(Kind.COLLECTIONS, [
            { id: collectionId, metadata: collection }
          ])
        )
      } catch (e) {
        console.error(
          `Unable to fetch cover art for collection ${collectionId}`,
          e
        )
      } finally {
        inProgress.delete(key)
      }
    }
  )
}

export default function sagas() {
  return [
    watchAdd,
    createPlaylistSaga,
    watchEditPlaylist,
    watchAddTrackToPlaylist,
    watchRemoveTrackFromPlaylist,
    watchOrderPlaylist,
    watchPublishPlaylist,
    watchDeletePlaylist,
    watchFetchCoverArt,
    watchTrackErrors
  ]
}
