import { omit } from 'lodash'

import {
  UserCollectionMetadata,
  Variant,
  Collection,
  CollectionMetadata
} from '~/models/Collection'

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformatCollection = ({
  collection,
  omitUser = true
}: {
  collection: UserCollectionMetadata | CollectionMetadata
  omitUser?: boolean
}): Collection => {
  const reformatted = omitUser ? omit(collection, 'user') : collection
  reformatted.variant = Variant.USER_GENERATED
  return reformatted
}
