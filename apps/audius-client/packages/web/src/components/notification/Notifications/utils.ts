import {
  albumPage,
  fullAlbumPage,
  fullPlaylistPage,
  fullTrackPage,
  playlistPage
} from 'utils/route'

import { EntityType } from './types'

export const getEntityLink = (entity: EntityType, fullRoute = false) => {
  if ('track_id' in entity) {
    return fullRoute ? fullTrackPage(entity.permalink) : entity.permalink
  } else if (entity.playlist_id && entity.is_album) {
    const getRoute = fullRoute ? fullAlbumPage : albumPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
    )
  }
  const getRoute = fullRoute ? fullPlaylistPage : playlistPage
  return getRoute(entity.user.handle, entity.playlist_name, entity.playlist_id)
}
