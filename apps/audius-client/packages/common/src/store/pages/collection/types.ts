import { Moment } from 'moment'

import {
  ID,
  UID,
  Collectible,
  LineupState,
  SmartCollectionVariant,
  Status,
  LineupTrack
} from 'models'

export type CollectionTrack = LineupTrack & { dateAdded: Moment } & {
  collectible?: Collectible
}

export type CollectionsPageState = {
  collectionPermalink: string
  collectionId: ID | null
  collectionUid: UID | null
  status: Status | null
  tracks: LineupState<CollectionTrack>
  userUid: UID | null
  smartCollectionVariant: SmartCollectionVariant
}

export type CollectionsPageType = 'playlist' | 'album'

export type CollectionPageTrackRecord = CollectionTrack & {
  key: string
  name: string
  artist: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}
