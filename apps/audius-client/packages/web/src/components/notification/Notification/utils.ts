import { Entity, EntityType } from 'common/store/notifications/types'
import AudiusBackend from 'services/AudiusBackend'
import { UserListEntityType } from 'store/application/ui/userListModal/types'
import {
  albumPage,
  fullAlbumPage,
  fullPlaylistPage,
  fullTrackPage,
  playlistPage
} from 'utils/route'

export const getEntityLink = (entity: EntityType, fullRoute = false) => {
  if ('track_id' in entity) {
    return fullRoute ? fullTrackPage(entity.permalink) : entity.permalink
  } else if (entity.user && entity.playlist_id && entity.is_album) {
    const getRoute = fullRoute ? fullAlbumPage : albumPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
    )
  }
  if (entity.user) {
    const getRoute = fullRoute ? fullPlaylistPage : playlistPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id
    )
  }
  return ''
}

export const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

export const getTwitterHandleByUserHandle = async (userHandle: string) => {
  const { twitterHandle } = await AudiusBackend.getCreatorSocialHandle(
    userHandle
  )
  return twitterHandle || ''
}

export const USER_LENGTH_LIMIT = 9

export const entityToUserListEntity = {
  [Entity.Track]: UserListEntityType.TRACK,
  [Entity.User]: UserListEntityType.USER,
  [Entity.Album]: UserListEntityType.COLLECTION,
  [Entity.Playlist]: UserListEntityType.COLLECTION
}
