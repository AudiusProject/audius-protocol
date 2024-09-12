import { EntityType } from '~/store/notifications'

import { Nullable } from './typeUtils'

export const isEntityHidden = (entity?: Nullable<EntityType>) => {
  if (!entity) return true
  if ('track_id' in entity) {
    return entity.is_unlisted
  }
  if ('playlist_id' in entity) {
    return entity.is_private
  }
  return false
}
