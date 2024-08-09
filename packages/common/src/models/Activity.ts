import { UserCollectionMetadata } from './Collection'
import { UserTrackMetadata } from './Track'

export type CollectionActivity = {
  timestamp: string
  item_type: 'playlist'
  item?: UserCollectionMetadata
}

export type TrackActivity = {
  timestamp: string
  item_type: 'track'
  item?: UserTrackMetadata
}

export type RepostActivity = CollectionActivity | TrackActivity
