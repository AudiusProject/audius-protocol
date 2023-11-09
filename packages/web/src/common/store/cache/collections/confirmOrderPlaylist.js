import { Kind } from '@audius/common/models/Kind'
import { PlaylistOperations } from '@audius/common/store/cache'
import { update } from '@audius/common/store/cache/actions'
import { orderPlaylistFailed } from '@audius/common/store/cache/collections/actions'
import { confirmTransaction } from '@audius/common/store/confirmer'
import { requestConfirmation } from '@audius/common/store/confirmer/actions'
import { getContext } from '@audius/common/store/effects'
import { makeKindId } from '@audius/common/utils/uid'
import { call, put } from 'redux-saga/effects'

import { fixInvalidTracksInPlaylist } from './fixInvalidTracksInPlaylist'
import { retrieveCollection } from './utils/retrieveCollections'
export function* confirmOrderPlaylist(userId, playlistId, trackIds, playlist) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield put(
    requestConfirmation(
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
          update(Kind.COLLECTIONS, [
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
          orderPlaylistFailed(
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
