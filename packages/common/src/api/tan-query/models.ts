import { Collection } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { Track } from '~/models/Track'

export type TQCollection = Omit<Collection, 'tracks'> & {
  trackIds: ID[]
}

export type TQTrack = Omit<Track, 'user'>
