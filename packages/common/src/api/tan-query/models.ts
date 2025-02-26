import { CollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { TrackMetadata } from '~/models/Track'

export type TQCollection = Omit<CollectionMetadata, 'tracks'> & {
  trackIds: ID[]
}

export type TQTrack = Omit<TrackMetadata, 'user'>
