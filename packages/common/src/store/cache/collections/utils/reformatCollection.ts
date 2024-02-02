import { omit } from 'lodash'

import {
  UserCollectionMetadata,
  Variant,
  Collection,
  CollectionMetadata
} from '~/models/Collection'
import type { AudiusBackend } from '~/services/audius-backend/AudiusBackend'

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformatCollection = ({
  collection,
  audiusBackendInstance,
  omitUser = true
}: {
  collection: UserCollectionMetadata | CollectionMetadata
  audiusBackendInstance: AudiusBackend
  omitUser?: boolean
}): Collection => {
  const base = omitUser ? omit(collection, 'user') : collection
  const withImages = audiusBackendInstance.getCollectionImages(base)
  withImages.variant = Variant.USER_GENERATED
  return withImages
}
