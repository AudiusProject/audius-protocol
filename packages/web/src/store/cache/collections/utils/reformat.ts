import AudiusBackend from 'services/AudiusBackend'
import Collection, { Variant } from 'models/Collection'
import { omit } from 'lodash'

/**
 * Adds cover_art_url to a collection object if it does not have one set
 */
const addCollectionImages = (collection: Collection) => {
  return AudiusBackend.getCollectionImages(collection)
}

/**
 * Reformats a collection to be used internally within the client
 * This method should *always* be called before a collection is cached.
 */
export const reformat = (collection: Collection) => {
  let c = collection
  c = omit(c, 'user')
  c = addCollectionImages(c)
  c.variant = Variant.USER_GENERATED
  return c
}
