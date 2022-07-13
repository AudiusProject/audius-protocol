import { EntityType } from 'audius-client/src/common/store/notifications/types'

import { getCollectionRoute, getTrackRoute } from 'app/utils/routes'

export const getEntityRoute = (entity: EntityType, fullUrl = false) => {
  if ('track_id' in entity) {
    return getTrackRoute(entity, fullUrl)
  } else if (entity.user) {
    const { user } = entity
    return getCollectionRoute({ ...entity, user }, fullUrl)
  }
  return ''
}

export const getEntityScreen = (entity: EntityType) => {
  if ('track_id' in entity) {
    return {
      screen: 'Track' as const,
      params: { id: entity.track_id, fromNotifications: true }
    }
  }
  return {
    screen: 'Collection' as const,
    params: { id: entity.playlist_id, fromNotifications: true }
  }
}
