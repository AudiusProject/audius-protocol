import {
  ID,
  Name,
  notificationsActions,
  notificationsSelectors
} from '@audius/common'
import { put, select } from 'typed-redux-saga'

import { make } from '../analytics/actions'
const { getPlaylistUpdates } = notificationsSelectors
const { setPlaylistUpdates } = notificationsActions

export function* recordPlaylistUpdatesAnalytics(playlistUpdates: ID[]) {
  const existingUpdates: ID[] = yield* select(getPlaylistUpdates)
  if (
    playlistUpdates.length > 0 &&
    existingUpdates.length !== playlistUpdates.length
  ) {
    yield* put(setPlaylistUpdates(playlistUpdates))
    const event = make(Name.PLAYLIST_LIBRARY_HAS_UPDATE, {
      count: playlistUpdates.length
    })
    yield* put(event)
  }
}
