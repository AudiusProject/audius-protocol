import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '@audius/common/adapters'
import { ID, Id, OptionalId } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  getContext,
  getSDK
} from '@audius/common/store'
import { call, select } from 'typed-redux-saga'

import { waitForWrite } from 'utils/sagaHelpers'

const { getCollection } = cacheCollectionsSelectors
const { getUserId } = accountSelectors

// Removes the invalid track ids from the playlist by calling `dangerouslySetPlaylistOrder`
export function* fixInvalidTracksInPlaylist(
  playlistId: ID,
  invalidTrackIds: ID[]
) {
  yield* waitForWrite()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  const removedTrackIds = new Set(invalidTrackIds)

  const playlist = yield* select(getCollection, { id: playlistId })

  if (!playlist) return

  const trackIds = playlist.playlist_contents.track_ids
    .map(({ track }) => track)
    .filter((id) => !removedTrackIds.has(id))

  const { error } = yield* call(
    audiusBackendInstance.dangerouslySetPlaylistOrder,
    playlistId,
    trackIds
  )
  if (error) throw error

  const currentUserId = yield* select(getUserId)
  const { data = [] } = yield* call(
    [sdk.full.playlists, sdk.full.playlists.getPlaylist],
    {
      playlistId: Id.parse(playlistId),
      userId: OptionalId.parse(currentUserId)
    }
  )
  const playlists = transformAndCleanList(data, userCollectionMetadataFromSDK)
  return playlists[0]
}
