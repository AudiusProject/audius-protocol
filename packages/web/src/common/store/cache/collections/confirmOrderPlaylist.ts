import { Kind, Collection, ID } from '@audius/common/models'
import {
  cacheCollectionsActions as collectionActions,
  cacheActions,
  PlaylistOperations,
  getContext,
  confirmerActions,
  confirmTransaction
} from '@audius/common/store'
import { makeKindId } from '@audius/common/utils'
import { call, put } from 'typed-redux-saga'

import { retrieveCollection } from './utils/retrieveCollections'
export function* confirmOrderPlaylist(
  userId: ID,
  playlistId: ID,
  trackIds: ID[],
  playlist: Collection
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.orderPlaylist,
          playlist
        )

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm order playlist for playlist id ${playlistId}`
          )
        }

        return playlistId
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
      },
      function* ({ error, timeout }) {
        // Fail Call
        yield* put(
          collectionActions.orderPlaylistFailed(
            error,
            { userId, playlistId, trackIds },
            { error, timeout }
          )
        )
      },
      (result: Collection) =>
        result.playlist_id ? result.playlist_id : playlistId,
      undefined,
      { operationId: PlaylistOperations.REORDER, squashable: true }
    )
  )
}
