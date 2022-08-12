import { UserCollectionMetadata, Variant } from '@audius/common'
import { omit } from 'lodash'

import { AudiusBackend } from 'common/services/audius-backend'

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformat = (
  collection: UserCollectionMetadata,
  audiusBackendInstance: AudiusBackend
) => {
  const withoutUser = omit(collection, 'user')
  const withImages = audiusBackendInstance.getCollectionImages(withoutUser)
  withImages.variant = Variant.USER_GENERATED
  return withImages
}
