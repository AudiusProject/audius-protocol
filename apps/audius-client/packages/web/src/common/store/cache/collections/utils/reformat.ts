import {
  Collection,
  CollectionMetadata,
  UserCollectionMetadata,
  Variant
} from '@audius/common'
import { omit } from 'lodash'

import AudiusBackend from 'services/AudiusBackend'

/**
 * Adds cover_art_url to a collection object if it does not have one set
 */
const addCollectionImages = (collection: CollectionMetadata): Collection => {
  return AudiusBackend.getCollectionImages(collection)
}

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformat = (collection: UserCollectionMetadata) => {
  const withoutUser = omit(collection, 'user')
  const withImages = addCollectionImages(withoutUser)
  withImages.variant = Variant.USER_GENERATED
  return withImages
}
