import type { EntityType } from '@audius/common/store'

import { getCollectionRoute, getTrackRoute } from 'app/utils/routes'

export const getEntityRoute = (entity: EntityType, fullUrl = false) => {
  if ('track_id' in entity) {
    return getTrackRoute(entity, fullUrl)
  } else if (entity.user) {
    return getCollectionRoute(entity, fullUrl)
  }
}

export const getEntityScreen = (entity: EntityType) => {
  if ('track_id' in entity) {
    return [
      'Track',
      { trackId: entity.track_id, fromNotifications: true }
    ] as const
  }
  return [
    'Collection',
    { collectionId: entity.playlist_id, fromNotifications: true }
  ] as const
}
