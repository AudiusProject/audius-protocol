import { Collection } from 'audius-client/src/common/models/Collection'

export type ExtendedCollection = Collection & {
  ownerHandle: string
  ownerName: string
}
