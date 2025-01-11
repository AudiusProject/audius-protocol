import { full } from '@audius/sdk'

import type { Dayjs } from '~/utils/dayjs'
import { ValueOf } from '~/utils/typeUtils'

import {
  ID,
  Collection,
  Favorite,
  LineupState,
  LineupTrack
} from '../../../models'

export const LibraryCategory = full.GetUserLibraryTracksTypeEnum
export type LibraryCategoryType = ValueOf<typeof LibraryCategory>

export function isLibraryCategory(value: string): value is LibraryCategoryType {
  return Object.values(LibraryCategory).includes(value as LibraryCategoryType)
}

// Note: Local saves were removed in favor of server-side persistence only
export interface SavedPageState {
  tracks: LineupState<LineupTrack & { id: ID; dateSaved: string }>
  trackSaves: Favorite[]
  hasReachedEnd: boolean
  initialFetch: boolean
  fetchingMore: boolean

  tracksCategory: LibraryCategoryType
  collectionsCategory: LibraryCategoryType
}

export enum SavedPageTabs {
  TRACKS = 'Tracks',
  ALBUMS = 'Albums',
  PLAYLISTS = 'Playlists'
}

export type SavedPageTrack = LineupTrack & { dateSaved: string }

export type TrackRecord = SavedPageTrack & {
  key: string
  name: string
  artist: string
  handle: string
  date: Dayjs
  time: number
  plays: number | undefined
}

export type SavedPageCollection = Collection & {
  ownerHandle: string
}
