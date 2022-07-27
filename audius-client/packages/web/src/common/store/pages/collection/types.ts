import {
  ID,
  UID,
  Collectible,
  LineupState,
  SmartCollectionVariant,
  Status,
  LineupTrack
} from '@audius/common'
import { Moment } from 'moment'

export type CollectionsPageState = {
  collectionId: ID | null
  collectionUid: UID | null
  status: Status | null
  tracks: LineupState<{ dateAdded: Moment }>
  userUid: UID | null
  smartCollectionVariant: SmartCollectionVariant
}

export type CollectionsPageType = 'playlist' | 'album'

export type CollectionTrack = LineupTrack & { dateAdded: Moment } & {
  collectible?: Collectible
}

export type TrackRecord = CollectionTrack & {
  key: string
  name: string
  artist: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}
