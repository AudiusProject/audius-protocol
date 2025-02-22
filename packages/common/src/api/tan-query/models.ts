import { CollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { TrackMetadata } from '~/models/Track'

export type TQTrack = TrackMetadata & {
  userId: ID
}

export type TQCollection = Omit<CollectionMetadata, 'tracks'> & {
  userId: ID
  tracks: ID[]
}
