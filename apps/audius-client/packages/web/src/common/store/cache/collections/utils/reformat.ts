import {
  UserCollectionMetadata,
  Variant,
  AudiusBackend,
  Collection,
  CollectionMetadata
} from '@audius/common'
import { omit } from 'lodash'

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformat = (
  collection: CollectionMetadata | UserCollectionMetadata,
  audiusBackendInstance: AudiusBackend
): Collection => {
  const withoutUser = omit(collection, 'user')
  const withImages = audiusBackendInstance.getCollectionImages(withoutUser)
  withImages.variant = Variant.USER_GENERATED
  return withImages
}
