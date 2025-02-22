import { CollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'

export type TQCollection = Omit<CollectionMetadata, 'tracks'> & {
  trackIds: ID[]
}
