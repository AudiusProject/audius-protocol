import {
  accountSelectors,
  cacheCollectionsSelectors,
  getContext
} from '@audius/common/store'
import { call, select } from 'redux-saga/effects'

import { waitForWrite } from 'utils/sagaHelpers'

const { getCollection } = cacheCollectionsSelectors
const { getUserId } = accountSelectors

// Removes the invalid track ids from the playlist by calling `dangerouslySetPlaylistOrder`
export function* fixInvalidTracksInPlaylist(playlistId, invalidTrackIds) {
  yield waitForWrite()
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const apiClient = yield getContext('apiClient')
  const removedTrackIds = new Set(invalidTrackIds)

  const playlist = yield select(getCollection, { id: playlistId })

  const trackIds = playlist.playlist_contents.track_ids
    .map(({ track }) => track)
    .filter((id) => !removedTrackIds.has(id))
  const { error } = yield call(
    audiusBackendInstance.dangerouslySetPlaylistOrder,
    playlistId,
    trackIds
  )
  if (error) throw error

  const currentUserId = yield select(getUserId)
  const playlists = yield apiClient.getPlaylist({
    playlistId,
    currentUserId
  })
  return playlists[0]
}
