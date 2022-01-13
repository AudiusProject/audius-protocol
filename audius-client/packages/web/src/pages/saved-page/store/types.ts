import { Moment } from 'moment'

import { Collection } from 'common/models/Collection'
import { Favorite } from 'common/models/Favorite'
import { UID, ID } from 'common/models/Identifiers'
import { LineupTrack } from 'common/models/Track'
import { LineupState } from 'models/common/Lineup'

export default interface SavesPageState {
  localSaves: { [id: number]: UID }
  tracks: LineupState<{ id: ID; dateSaved: string }>
  saves: Favorite[]
}

export enum Tabs {
  TRACKS = 'TRACKS',
  ALBUMS = 'ALBUMS',
  PLAYLISTS = 'PLAYLISTS'
}

export type SavedPageTrack = LineupTrack & { dateSaved: string }

export type TrackRecord = SavedPageTrack & {
  key: string
  name: string
  artist: string
  handle: string
  date: Moment
  time: number
  plays: number | undefined
}

export type SavedPageCollection = Collection & {
  ownerHandle: string
}
