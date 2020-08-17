import Collection from 'models/Collection'
import { UID, ID } from 'models/common/Identifiers'
import { LineupState } from 'models/common/Lineup'
import { Moment } from 'moment'
import Favorite from 'models/Favorite'
import { LineupTrack } from 'models/Track'

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
