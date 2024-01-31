import {
  cacheCollectionsActions as collectionActions,
  cacheActions,
  PlaylistOperations,
  getContext,
  confirmerActions,
  confirmTransaction
} from '@audius/common/store'

import { Kind } from '@audius/common/models'
import { makeKindId } from '@audius/common/utils'
import { call, put } from 'redux-saga/effects'

import { fixInvalidTracksInPlaylist } from './fixInvalidTracksInPlaylist'
import { retrieveCollection } from './utils/retrieveCollections'
export function* confirmOrderPlaylist(userId, playlistId, trackIds, playlist) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* (confirmedPlaylistId) {
        // NOTE: In an attempt to fix playlists in a corrupted state, only attempt the order playlist tracks once,
        // if it fails, check if the playlist is in a corrupted state and if so fix it before re-attempting to order playlist
        let { blockHash, blockNumber, error } = yield call(
          audiusBackendInstance.orderPlaylist,
          playlist
        )
        if (error) {
          const { error, isValid, invalidTrackIds } = yield call(
            audiusBackendInstance.validateTracksInPlaylist,
            confirmedPlaylistId
          )
          if (error) throw error
          if (!isValid) {
            yield call(
              fixInvalidTracksInPlaylist,
              confirmedPlaylistId,
              invalidTrackIds
            )
            const invalidIds = new Set(invalidTrackIds)
            trackIds = trackIds.filter((id) => !invalidIds.has(id))
          }
          // TODO fix validation which relies on legacy contract
          const response = yield call(
            audiusBackendInstance.orderPlaylist,
            trackIds
          )
          if (response.error) {
            throw response.error
          }

          blockHash = response.blockHash
          blockNumber = response.blockNumber
        }

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm order playlist for playlist id ${playlistId}`
          )
        }

        return playlistId
      },
      function* (confirmedPlaylistId) {
        const [confirmedPlaylist] = yield call(retrieveCollection, {
          playlistId: confirmedPlaylistId
        })

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
      (result) => (result.playlist_id ? result.playlist_id : playlistId),
      undefined,
      { operationId: PlaylistOperations.REORDER, squashable: true }
    )
  )
}
