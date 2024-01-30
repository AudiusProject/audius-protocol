import {
  ID,
  UserCollectionMetadata,
  accountSelectors,
  cacheCollectionsSelectors,
  getContext
} from '@audius/common'
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
  const apiClient = yield* getContext('apiClient')
  const removedTrackIds = new Set(invalidTrackIds)

  const playlist = yield* select(getCollection, { id: playlistId })

  if (!playlist) return

  const trackIds = playlist.playlist_contents.track_ids
    .map(({ track }) => track)
    .filter((id) => !removedTrackIds.has(id))

  // Debug
  const { error } = yield* call(
    audiusBackendInstance.dangerouslySetPlaylistOrder,
    playlistId,
    trackIds
  )
  if (error) throw error

  const currentUserId = yield* select(getUserId)
  const playlists: UserCollectionMetadata[] = yield apiClient.getPlaylist({
    playlistId,
    currentUserId
  })
  return playlists[0]
}
