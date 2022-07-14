import { ID, UID } from '@audius/common'
import { Moment } from 'moment'

import { Collectible } from 'common/models/Collectible'
import { LineupState } from 'common/models/Lineup'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import Status from 'common/models/Status'
import { LineupTrack } from 'common/models/Track'

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
