import { playlistMetadataForUpdateWithSDK } from '@audius/common/adapters'
import { queryCollection, updateCollectionData } from '@audius/common/api'
import { Kind, Collection, ID } from '@audius/common/models'
import {
  cacheCollectionsActions as collectionActions,
  PlaylistOperations,
  confirmerActions,
  getSDK
} from '@audius/common/store'
import { makeKindId } from '@audius/common/utils'
import { Id } from '@audius/sdk'
import { call, put } from 'typed-redux-saga'

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
          metadata: playlistMetadataForUpdateWithSDK(playlist),
          userId: Id.parse(userId),
          playlistId: Id.parse(playlistId)
        })

        return playlistId
      },
      function* (confirmedPlaylistId: ID) {
        const confirmedPlaylist = yield* call(
          queryCollection,
          confirmedPlaylistId
        )

        if (!confirmedPlaylist) return

        yield* call(updateCollectionData, [confirmedPlaylist])
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
