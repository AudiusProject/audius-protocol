import type { EntityType } from '@audius/common/store'

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
    return ['Track', { id: entity.track_id, fromNotifications: true }] as const
  }
  return [
    'Collection',
    { id: entity.playlist_id, fromNotifications: true }
  ] as const
}
