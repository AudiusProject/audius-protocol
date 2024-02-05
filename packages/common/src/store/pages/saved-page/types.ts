import { full } from '@audius/sdk'

import type { Dayjs } from '~/utils/dayjs'
import { ValueOf } from '~/utils/typeUtils'

import {
  UID,
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
export interface SavedPageState {
  local: {
    track: {
      favorites: {
        added: { [id: number]: UID }
        removed: { [id: number]: UID }
      }
      reposts: {
        added: { [id: number]: UID }
        removed: { [id: number]: UID }
      }
      purchased: {
        added: { [id: number]: UID }
      }
    }
    album: {
      favorites: {
        added: ID[]
        removed: ID[]
      }
      reposts: {
        added: ID[]
        removed: ID[]
      }
      purchased: {
        added: ID[]
      }
    }
    playlist: {
      favorites: {
        added: ID[]
        removed: ID[]
      }
      reposts: {
        added: ID[]
        removed: ID[]
      }
    }
  }
  tracks: LineupState<LineupTrack & { id: ID; dateSaved: string }>
  trackSaves: Favorite[]
  hasReachedEnd: boolean
  initialFetch: boolean
  fetchingMore: boolean

  tracksCategory: LibraryCategoryType
  collectionsCategory: LibraryCategoryType
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
  date: Dayjs
  time: number
  plays: number | undefined
}

export type SavedPageCollection = Collection & {
  ownerHandle: string
}
