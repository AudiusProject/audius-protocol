import { collectionMetadataForSDK } from '@audius/common/adapters'
import { Kind, Collection, ID, Id } from '@audius/common/models'
import {
  cacheCollectionsActions as collectionActions,
  cacheActions,
  PlaylistOperations,
  confirmerActions,
  getSDK
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
  const sdk = yield* getSDK()
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* () {
        yield* call([sdk.playlists, sdk.playlists.updatePlaylist], {
          metadata: collectionMetadataForSDK(playlist),
          userId: Id.parse(userId),
          playlistId: Id.parse(playlistId)
        })

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
