import {
  call,
  put,
  all,
  select,
  takeLatest,
  takeEvery,
  fork
} from 'redux-saga/effects'
import { pick, some } from 'lodash'

import * as collectionActions from 'store/cache/collections/actions'
import * as confirmerActions from 'store/confirmer/actions'
import * as cacheActions from 'store/cache/actions'
import * as accountActions from 'store/account/reducer'
import {
  getUserId,
  getUserHandle,
  getAccountUser
} from 'store/account/selectors'
import { getUser } from 'store/cache/users/selectors'
import { getCollection } from 'store/cache/collections/selectors'
import { getTrack, getTracks } from 'store/cache/tracks/selectors'
import AudiusBackend from 'services/AudiusBackend'
import { waitForBackendSetup } from 'store/backend/sagas'
import { pollPlaylist, pollTrack } from 'store/confirmer/sagas'
import { Kind } from 'store/types'
import { makeUid, makeKindId } from 'utils/uid'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { fetchUsers } from 'store/cache/users/sagas'
import * as signOnActions from 'containers/sign-on/store/actions'
import { DefaultSizes } from 'models/common/ImageSizes'
import { squashNewLines, formatUrlName } from 'utils/formatUtil'
import { make } from 'store/analytics/actions'
import { Name } from 'services/analytics'
import watchTrackErrors from './errorSagas'
import { retrieveCollections } from './utils/retrieveCollections'

/** Counts instances of trackId in a playlist. */
const countTrackIds = (playlistContents, trackId) => {
  return playlistContents.track_ids
    .map(t => t.track)
    .reduce((acc, t) => {
      if (t === trackId) acc += 1
      return acc
    }, 0)
}

/** CREATE PLAYLIST */

function* watchCreatePlaylist() {
  yield takeLatest(collectionActions.CREATE_PLAYLIST, createPlaylistAsync)
}

function* createPlaylistAsync(action) {
  // Potentially grab artwork from the initializing track.
  if (action.initTrackId) {
    const track = yield select(getTrack, { id: action.initTrackId })
    action.formFields._cover_art_sizes = track._cover_art_sizes
    action.formFields.cover_art_sizes = track.cover_art_sizes
  }

  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  const uid = action.tempId
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }
  yield put(collectionActions.createPlaylistRequested())

  const playlist = { ...action.formFields }

  const event = make(Name.PLAYLIST_START_CREATE, {
    source: action.source,
    artworkSource: playlist.artwork ? playlist.artwork.source : ''
  })
  yield put(event)

  yield call(
    confirmCreatePlaylist,
    uid,
    userId,
    action.formFields,
    action.source
  )
  playlist.playlist_id = uid
  playlist.playlist_owner_id = userId
  playlist.is_private = true
  playlist.playlist_contents = { track_ids: [] }
  if (playlist.artwork) {
    playlist._cover_art_sizes = {
      ...playlist._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: playlist.artwork.url
    }
  }
  playlist._temp = true

  const subscribedUid = yield makeUid(Kind.COLLECTIONS, uid, 'account')
  yield put(
    cacheActions.add(
      Kind.COLLECTIONS,
      [
        {
          id: playlist.playlist_id,
          uid: subscribedUid,
          metadata: { ...playlist, is_album: false }
        }
      ],
      /* replace= */ true, // forces cache update
      /* persistent cache */ false // Do not persistent cache since it's missing data
    )
  )
  const user = yield select(getUser, { id: userId })
  yield put(
    accountActions.addAccountPlaylist({
      id: playlist.playlist_id,
      name: playlist.playlist_name,
      isAlbum: playlist.is_album,
      user: { id: userId, handle: user.handle }
    })
  )
  yield put(collectionActions.createPlaylistSucceeded())
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: { _collectionIds: (user._collectionIds || []).concat(uid) }
      }
    ])
  )
}

function* confirmCreatePlaylist(uid, userId, formFields, source) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, uid),
      function* () {
        const { playlistId, error } = yield call(
          AudiusBackend.createPlaylist,
          userId,
          formFields
        )
        if (error || !playlistId) throw new Error('Unable to create playlist')
        const toConfirm = pick(formFields, ['playlist_name', 'description'])
        let check
        // If the user is trying to upload artwork, check that an artwork gets set.
        if (formFields.artwork && formFields.artwork.file) {
          check = playlist =>
            some([playlist], toConfirm) &&
            playlist.playlist_image_sizes_multihash
        } else {
          check = playlist => some([playlist], toConfirm)
        }
        return yield call(pollPlaylist, playlistId, userId, check)
      },
      function* (confirmedPlaylist) {
        const subscribedUid = makeUid(
          Kind.COLLECTIONS,
          confirmedPlaylist.playlist_id,
          'account'
        )
        const movedCollection = yield select(getCollection, { id: uid })

        // On playlist creation, copy over all fields from the temp collection
        // to retain optimistically set fields.
        yield put(
          cacheActions.add(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              uid: subscribedUid,
              metadata: {
                ...movedCollection,
                ...confirmedPlaylist,
                _temp: false
              }
            }
          ])
        )
        const user = yield select(getUser, { id: userId })
        yield put(
          cacheActions.update(Kind.USERS, [
            {
              id: userId,
              metadata: {
                _collectionIds: (user._collectionIds || [])
                  .filter(cId => cId !== uid)
                  .concat(confirmedPlaylist.playlist_id)
              }
            }
          ])
        )
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            { id: uid, metadata: { _moved: subscribedUid } }
          ])
        )
        yield put(accountActions.removeAccountPlaylist({ collectionId: uid }))
        yield put(
          accountActions.addAccountPlaylist({
            id: confirmedPlaylist.playlist_id,
            name: confirmedPlaylist.playlist_name,
            isAlbum: confirmedPlaylist.is_album,
            user: {
              id: user.user_id,
              handle: user.handle
            }
          })
        )

        const event = make(Name.PLAYLIST_COMPLETE_CREATE, {
          source,
          status: 'success'
        })
        yield put(event)
      },
      function* ({ error, timeout, message }) {
        const event = make(Name.PLAYLIST_COMPLETE_CREATE, {
          source,
          status: 'failure'
        })
        yield put(event)
        yield put(
          collectionActions.createPlaylistFailed(
            message,
            { userId, formFields, source },
            { error, timeout }
          )
        )
      }
    )
  )
}

/** EDIT PLAYLIST */

function* watchEditPlaylist() {
  yield takeLatest(collectionActions.EDIT_PLAYLIST, editPlaylistAsync)
}

function* editPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Updated the stored account playlist shortcut
  yield put(
    accountActions.renameAccountPlaylist({
      collectionId: action.playlistId,
      name: action.formFields.playlist_name
    })
  )

  yield call(confirmEditPlaylist, action.playlistId, userId, action.formFields)

  const playlist = { ...action.formFields }
  playlist.playlist_id = action.playlistId
  if (playlist.artwork) {
    playlist._cover_art_sizes = {
      ...playlist._cover_art_sizes
    }
    if (playlist.artwork.url) {
      playlist._cover_art_sizes[DefaultSizes.OVERRIDE] = playlist.artwork.url
    }
  }
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: playlist
      }
    ])
  )
  yield put(collectionActions.editPlaylistSucceeded())
}

function* confirmEditPlaylist(playlistId, userId, formFields) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        const { error } = yield call(
          AudiusBackend.updatePlaylist,
          confirmedPlaylistId,
          { ...formFields }
        )
        if (error) throw error
        const toConfirm = pick(formFields, ['playlist_name', 'description'])
        let check
        // If the user is trying to upload a new album artwork, check for a new CID in confirmation.
        if (formFields.artwork.file) {
          check = playlist => {
            return (
              some([playlist], toConfirm) &&
              playlist.cover_art_sizes !== formFields.cover_art_sizes
            )
          }
        } else {
          check = playlist => some([playlist], toConfirm)
        }
        return yield call(pollPlaylist, confirmedPlaylistId, userId, check)
      },
      function* (confirmedPlaylist) {
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        yield put(
          collectionActions.editPlaylistFailed(
            message,
            { playlistId, userId, formFields },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

/** ADD TRACK TO PLAYLIST */

function* watchAddTrackToPlaylist() {
  yield takeEvery(
    collectionActions.ADD_TRACK_TO_PLAYLIST,
    addTrackToPlaylistAsync
  )
}

function* addTrackToPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Retrieve tracks with the the collection so we confirm with the
  // most up-to-date information.
  const { collections } = yield call(
    retrieveCollections,
    userId,
    [action.playlistId],
    true
  )
  const playlist = collections[action.playlistId]

  const trackUid = makeUid(
    Kind.TRACKS,
    action.trackId,
    `collection:${action.playlistId}`
  )
  playlist.playlist_contents = {
    track_ids: playlist.playlist_contents.track_ids.concat({
      track: action.trackId,
      time: Math.round(Date.now() / 1000),
      uid: trackUid
    })
  }
  const count = countTrackIds(playlist.playlist_contents, action.trackId)

  const event = make(Name.PLAYLIST_ADD, {
    trackId: action.trackId,
    playlistId: action.playlistId
  })
  yield put(event)

  yield call(
    confirmAddTrackToPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: {
          playlist_contents: playlist.playlist_contents
        }
      }
    ])
  )
  yield put(
    cacheActions.subscribe(Kind.TRACKS, [{ uid: trackUid, id: action.trackId }])
  )
}

function* confirmAddTrackToPlaylist(userId, playlistId, trackId, count) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        const { error } = yield call(
          AudiusBackend.addPlaylistTrack,
          confirmedPlaylistId,
          trackId
        )
        if (error) throw error
        return yield call(
          pollPlaylist,
          confirmedPlaylistId,
          userId,
          playlist =>
            countTrackIds(playlist.playlist_contents, trackId) >= count
        )
      },
      function* (confirmedPlaylist) {
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.addTrackToPlaylistFailed(
            message,
            { userId, playlistId, trackId, count },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

/** REMOVE TRACK FROM PLAYLIST */

function* watchRemoveTrackFromPlaylist() {
  yield takeEvery(
    collectionActions.REMOVE_TRACK_FROM_PLAYLIST,
    removeTrackFromPlaylistAsync
  )
}

function* removeTrackFromPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const playlist = yield select(getCollection, { id: action.playlistId })

  // Find the index of the track based on the track's id and timestamp
  const index = playlist.playlist_contents.track_ids.findIndex(
    t => t.time === action.timestamp && t.track === action.trackId
  )
  if (index === -1) {
    console.error('Could not find the index of to-be-deleted track')
    return
  }

  const track = playlist.playlist_contents.track_ids[index]
  playlist.playlist_contents.track_ids.splice(index, 1)
  const count = countTrackIds(playlist.playlist_contents, action.trackId)

  yield call(
    confirmRemoveTrackFromPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    track.time,
    count
  )
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: {
          playlist_contents: playlist.playlist_contents
        }
      }
    ])
  )
}

// Removes the invalid track ids from the playlist by calling `dangerouslySetPlaylistOrder`
function* fixInvalidTracksInPlaylist(playlistId, userId, invalidTrackIds) {
  yield call(waitForBackendSetup)
  const removedTrackIds = new Set(invalidTrackIds)

  const playlist = yield select(getCollection, { id: playlistId })

  const trackIds = playlist.playlist_contents.track_ids
    .map(({ track }) => track)
    .filter(id => !removedTrackIds.has(id))
  const { error } = yield call(
    AudiusBackend.dangerouslySetPlaylistOrder,
    playlistId,
    trackIds
  )
  if (error) throw error
  const updatedPlaylist = yield call(
    pollPlaylist,
    playlistId,
    userId,
    playlist =>
      playlist.playlist_contents.track_ids
        .map(t => t.track)
        .every((e, i) => e === trackIds[i])
  )
  return updatedPlaylist
}

function* confirmRemoveTrackFromPlaylist(
  userId,
  playlistId,
  trackId,
  timestamp,
  count
) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        // NOTE: In an attempt to fix playlists in a corrupted state, only attempt the delete playlist track once,
        // if it fails, check if the playlist is in a corrupted state and if so fix it before re-attempting to delete track from playlist
        const { error } = yield call(
          AudiusBackend.deletePlaylistTrack,
          confirmedPlaylistId,
          trackId,
          timestamp,
          0
        )
        if (error) {
          const {
            error: tracksInPlaylistError,
            isValid,
            invalidTrackIds
          } = yield call(
            AudiusBackend.validateTracksInPlaylist,
            confirmedPlaylistId
          )
          if (tracksInPlaylistError) throw tracksInPlaylistError
          if (!isValid) {
            const updatedPlaylist = yield call(
              fixInvalidTracksInPlaylist,
              confirmedPlaylistId,
              userId,
              invalidTrackIds
            )
            const isTrackRemoved =
              countTrackIds(updatedPlaylist.playlist_contents, trackId) <= count
            if (isTrackRemoved) return updatedPlaylist
          }
          const { error: deletePlaylistError } = yield call(
            AudiusBackend.deletePlaylistTrack,
            confirmedPlaylistId,
            trackId,
            timestamp
          )
          if (deletePlaylistError) throw deletePlaylistError
        }

        return yield call(
          pollPlaylist,
          confirmedPlaylistId,
          userId,
          playlist =>
            countTrackIds(playlist.playlist_contents, trackId) <= count
        )
      },
      function* (confirmedPlaylist) {
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.removeTrackFromPlaylistFailed(
            message,
            { userId, playlistId, trackId, timestamp, count },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

/** ORDER PLAYLIST */

function* watchOrderPlaylist() {
  yield takeEvery(collectionActions.ORDER_PLAYLIST, orderPlaylistAsync)
}

function* orderPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const playlist = yield select(getCollection, { id: action.playlistId })

  const trackIds = []
  const updatedPlaylist = {
    ...playlist,
    playlist_contents: {
      ...playlist.playlist_contents,
      track_ids: action.trackIdsAndTimes.map(({ id, time }) => {
        trackIds.push(id)
        return { track: id, time: time }
      })
    }
  }

  yield call(confirmOrderPlaylist, userId, action.playlistId, trackIds)
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: updatedPlaylist.playlist_id,
        metadata: updatedPlaylist
      }
    ])
  )
}

function* confirmOrderPlaylist(userId, playlistId, trackIds) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        // NOTE: In an attempt to fix playlists in a corrupted state, only attempt the order playlist tracks once,
        // if it fails, check if the playlist is in a corrupted state and if so fix it before re-attempting to order playlist
        const { error } = yield call(
          AudiusBackend.orderPlaylist,
          confirmedPlaylistId,
          trackIds,
          0
        )
        if (error) {
          const { error, isValid, invalidTrackIds } = yield call(
            AudiusBackend.validateTracksInPlaylist,
            confirmedPlaylistId
          )
          if (error) throw error
          if (!isValid) {
            yield call(
              fixInvalidTracksInPlaylist,
              confirmedPlaylistId,
              userId,
              invalidTrackIds
            )
            const invalidIds = new Set(invalidTrackIds)
            trackIds = trackIds.filter(id => !invalidIds.has(id))
          }
          const { error: orderPlaylistError } = yield call(
            AudiusBackend.orderPlaylist,
            confirmedPlaylistId,
            trackIds
          )
          if (orderPlaylistError) throw orderPlaylistError
        }
        return yield call(pollPlaylist, confirmedPlaylistId, userId, playlist =>
          playlist.playlist_contents.track_ids
            .map(t => t.track)
            .every((e, i) => e === trackIds[i])
        )
      },
      function* (confirmedPlaylist) {
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.orderPlaylistFailed(
            message,
            { userId, playlistId, trackIds },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

/** PUBLISH PLAYLIST */

function* watchPublishPlaylist() {
  yield takeEvery(collectionActions.PUBLISH_PLAYLIST, publishPlaylistAsync)
}

function* publishPlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  const event = make(Name.PLAYLIST_MAKE_PUBLIC, { id: action.playlistId })
  yield put(event)

  const playlist = yield select(getCollection, { id: action.playlistId })
  playlist._is_publishing = true
  yield put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: { _is_publishing: true }
      }
    ])
  )

  yield call(confirmPublishPlaylist, userId, action.playlistId)
}

function* confirmPublishPlaylist(userId, playlistId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        const { error } = yield call(
          AudiusBackend.publishPlaylist,
          confirmedPlaylistId
        )
        if (error) throw error
        return yield call(
          pollPlaylist,
          confirmedPlaylistId,
          userId,
          playlist => !playlist.is_private
        )
      },
      function* (confirmedPlaylist) {
        confirmedPlaylist.is_private = false
        confirmedPlaylist._is_publishing = false
        yield put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: confirmedPlaylist
            }
          ])
        )
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield put(
          collectionActions.publishPlaylistFailed(
            message,
            { userId, playlistId },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

/** DELETE PLAYLIST */

function* watchDeletePlaylist() {
  yield takeEvery(collectionActions.DELETE_PLAYLIST, deletePlaylistAsync)
}

function* deletePlaylistAsync(action) {
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }

  // Depending on whether the collection is an album
  // or playlist, we should either delete all the tracks
  // or just delete the collection.
  const collection = yield select(getCollection, { id: action.playlistId })
  if (!collection) return

  const isAlbum = collection.is_album
  if (isAlbum) {
    const trackIds = collection.playlist_contents.track_ids

    const event = make(Name.DELETE, { kind: 'album', id: action.playlistId })
    yield put(event)
    yield call(confirmDeleteAlbum, action.playlistId, trackIds, userId)
  } else {
    const event = make(Name.DELETE, { kind: 'playlist', id: action.playlistId })
    yield put(event)

    // Preemptively mark the playlist as deleted.
    // It's possible there are other transactions confirming
    // for this playlist, which prevent the delete confirmation
    // from running immediately, which would leave
    // the playlist visible before it runs.
    yield put(
      cacheActions.update(Kind.COLLECTIONS, [
        {
          id: action.playlistId,
          metadata: { _marked_deleted: true }
        }
      ])
    )
    yield call(confirmDeletePlaylist, userId, action.playlistId)
  }

  const user = yield select(getUser, { id: userId })
  yield put(
    cacheActions.update(Kind.USERS, [
      {
        id: userId,
        metadata: {
          _collectionIds: (user._collectionIds || []).filter(
            cId => cId !== action.playlistId
          )
        }
      }
    ])
  )
}

function* confirmDeleteAlbum(playlistId, trackIds, userId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),

      // we don't have to worry about passing in a confirmed ID
      // here because unlike deleting a playlist, when
      // deleting an album we know it's persisted to chain already
      // thus we have it's permanent ID.
      function* () {
        // Optimistically mark everything as deleted
        yield all([
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
              trackIds.map(t => ({
                id: t.track,
                metadata: { _marked_deleted: true }
              }))
            )
          ),
          put(
            accountActions.removeAccountPlaylist({ collectionId: playlistId })
          )
        ])

        const { error } = yield call(
          AudiusBackend.deleteAlbum,
          playlistId,
          trackIds
        )
        if (error) throw error
        const ids = trackIds.map(t => t.track)
        const tracks = yield select(getTracks, { ids })
        // We need to poll until both playlist and all tracks are deleted
        console.debug(`Polling for album ${playlistId}`)
        const handle = yield select(getUserHandle)
        return yield all(
          ids
            .map(id =>
              call(
                pollTrack,
                id,
                formatUrlName(tracks[id].title),
                handle,
                t => t.is_delete
              )
            )
            .concat(
              call(
                pollPlaylist,
                playlistId,
                userId,
                playlist => playlist.is_delete
              )
            )
        )
      },
      function* () {
        console.debug(`Successfully deleted album ${playlistId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [playlistId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete album ${playlistId}`)
        // Need to revert the deletes now
        const [playlist, user] = yield all([
          select(getCollection, { id: playlistId }),
          select(getAccountUser)
        ])
        yield all([
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
              trackIds.map(t => ({
                id: t.track,
                metadata: { _marked_deleted: false }
              }))
            )
          ),
          put(
            accountActions.addAccountPlaylist({
              id: playlist.playlist_id,
              name: playlist.playlist_name,
              isAlbum: playlist.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deletePlaylistFailed(
            message,
            { playlistId, trackIds, userId },
            { error, timeout }
          )
        )
      }
    )
  )
}

function* confirmDeletePlaylist(userId, playlistId) {
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        // Optimistically mark playlist as removed
        yield all([
          put(
            cacheActions.update(Kind.COLLECTIONS, [
              {
                id: confirmedPlaylistId,
                metadata: { _marked_deleted: true }
              }
            ])
          ),
          put(
            accountActions.removeAccountPlaylist({ collectionId: playlistId })
          )
        ])

        const { error } = yield call(
          AudiusBackend.deletePlaylist,
          confirmedPlaylistId
        )
        if (error) throw error
        return yield call(
          pollPlaylist,
          confirmedPlaylistId,
          userId,
          playlist => playlist.is_delete
        )
      },
      function* () {
        console.debug(`Successfully deleted playlist ${playlistId}`)
        yield put(cacheActions.remove(Kind.COLLECTIONS, [playlistId]))
      },
      function* ({ error, timeout, message }) {
        console.error(`Failed to delete playlist ${playlistId}`)
        const [playlist, user] = yield all([
          select(getCollection, { id: playlistId }),
          select(getAccountUser)
        ])
        yield all([
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
              isAlbum: playlist.is_album,
              user: { id: user.user_id, handle: user.handle }
            })
          )
        ])
        yield put(
          collectionActions.deletePlaylistFailed(
            message,
            { playlistId, userId },
            { error, timeout }
          )
        )
      },
      result => (result.playlist_id ? result.playlist_id : playlistId)
    )
  )
}

function* fetchRepostInfo(entries) {
  const userIds = []
  entries.forEach(entry => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach(repost =>
        userIds.push(repost.user_id)
      )
    }
  })
  if (userIds.length > 0) {
    const { entries: users, uids } = yield call(fetchUsers, userIds)

    const updates = []
    const subscriptions = []
    entries.forEach(entry => {
      const followeeRepostUsers = { id: entry.id, metadata: { _followees: [] } }
      const subscriptionUids = []
      entry.metadata.followee_reposts.forEach(repost => {
        followeeRepostUsers.metadata._followees.push({
          ...repost,
          ...users[repost.user_id]
        })
        subscriptionUids.push(uids[repost.user_id])
      })
      updates.push(followeeRepostUsers)
      if (subscriptionUids.length > 0) {
        subscriptions.push({
          id: entry.id,
          kind: Kind.USERS,
          uids: subscriptionUids
        })
      }
    })

    yield put(cacheActions.update(Kind.COLLECTIONS, updates, subscriptions))
  }
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.COLLECTIONS) {
      yield fork(fetchRepostInfo, action.entries)
    }
  })
}

function* watchFetchCoverArt() {
  const inProgress = new Set()
  yield takeEvery(collectionActions.FETCH_COVER_ART, function* ({
    collectionId,
    size
  }) {
    // Unique on id and size
    const key = `${collectionId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)

    try {
      const collection = yield select(getCollection, { id: collectionId })
      const user = yield select(getUser, { id: collection.playlist_owner_id })
      if (
        !collection ||
        !user ||
        (!collection.cover_art_sizes && !collection.cover_art)
      )
        return

      const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
      const multihash = collection.cover_art_sizes || collection.cover_art
      const coverArtSize =
        multihash === collection.cover_art_sizes ? size : null
      const url = yield call(
        AudiusBackend.getImageUrl,
        multihash,
        coverArtSize,
        gateways
      )
      collection._cover_art_sizes = {
        ...collection._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
      yield put(
        cacheActions.update(Kind.COLLECTIONS, [
          { id: collectionId, metadata: collection }
        ])
      )
    } catch (e) {
      console.error(`Unable to fetch cover art for collection ${collectionId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

export default function sagas() {
  return [
    watchAdd,
    watchCreatePlaylist,
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
