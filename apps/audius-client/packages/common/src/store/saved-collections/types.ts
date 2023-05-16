import { Collection } from '../../models/Collection'

export type CollectionType = 'albums' | 'playlists'

export type CollectionWithOwner = Collection & {
  ownerHandle: string
}
