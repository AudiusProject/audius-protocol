import { Moment } from 'moment'

import {
  UID,
  ID,
  Collection,
  Favorite,
  LineupState,
  LineupTrack
} from '../../../models'

export default interface SavesPageState {
  localSaves: { [id: number]: UID }
  tracks: LineupState<{ id: ID; dateSaved: string }>
  saves: Favorite[]
}

export enum SavedPageTabs {
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
