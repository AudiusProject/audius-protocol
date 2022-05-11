import { EntityType } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'
import AudiusBackend from 'services/AudiusBackend'
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

export const formatOthersCount = (userCount: number) =>
  ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`

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
