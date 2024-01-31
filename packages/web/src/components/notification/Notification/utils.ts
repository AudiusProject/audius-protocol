import { Entity, EntityType } from '@audius/common/store'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { UserListEntityType } from 'store/application/ui/userListModal/types'
import { fullCollectionPage, fullTrackPage, collectionPage } from 'utils/route'

export const getEntityLink = (entity: EntityType, fullRoute = false) => {
  if (!entity.user) return ''
  if ('track_id' in entity) {
    return fullRoute ? fullTrackPage(entity.permalink) : entity.permalink
  } else if (entity.user && entity.playlist_id) {
    const getRoute = fullRoute ? fullCollectionPage : collectionPage
    return getRoute(
      entity.user.handle,
      entity.playlist_name,
      entity.playlist_id,
      entity.permalink,
      entity.is_album
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
  const { twitterHandle } = await audiusBackendInstance.getSocialHandles(
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
