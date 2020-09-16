import Color from 'models/common/Color'
import { CID, ID, UID } from 'models/common/Identifiers'
import { CoverArtSizes } from 'models/common/ImageSizes'
import OnChain from 'models/common/OnChain'
import Repost from 'models/Repost'
import User from 'models/User'
import Favorite from 'models/Favorite'
import Timestamped from './common/Timestamped'
import { StemCategory } from './Stems'

export interface TrackSegment {
  duration: string
  multihash: CID
}

interface Followee extends User {
  is_delete: boolean
  repost_item_id: string
  repost_type: string
}

export interface Download {
  is_downloadable: boolean
  requires_follow: boolean
  cid: string | null
}

export type FieldVisibility = {
  genre: boolean
  mood: boolean
  tags: boolean
  share: boolean
  play_count: boolean
  remixes: boolean
}

export type Remix = {
  parent_track_id: ID
  user: User | any
  has_remix_author_reposted: boolean
  has_remix_author_saved: boolean
}

export type RemixOf = {
  tracks: Remix[]
}

export type TrackMetadata = {
  create_date: string | null
  created_at: string
  isrc: string | null
  iswc: string | null
  credits_splits: string | null
  description: string
  file_type: string | null
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  genre: string
  has_current_user_reposted: boolean
  is_current: boolean
  download: Download | null
  length: number | null
  license: string
  mood: string
  play_count: number
  owner_id: ID
  release_date: string
  repost_count: number
  save_count: number
  tags: string
  title: string
  track_segments: TrackSegment[]
  cover_art: CID | null
  cover_art_sizes: CID
  is_unlisted: boolean
  field_visibility?: FieldVisibility
  listenCount?: number
  dateListened?: string
  duration: number
  is_invalid?: boolean
  stem_of?: {
    parent_track_id: ID
    category: StemCategory
  }
  remix_of?: RemixOf
} & Timestamped

export type Stem = {
  track_id: ID
  category: StemCategory
}

export type Track = {
  activity_timestamp?: string
  has_current_user_saved: boolean
  is_delete: boolean
  metadata_multihash: CID
  track_id: number
  cover_art_url: string
  _cover_art_sizes: CoverArtSizes
  _first_segment?: string
  _followees?: Followee[]
  _cover_art_color?: Color
  _marked_deleted?: boolean
  _is_publishing?: boolean
  _stems?: Stem[]

  // Present iff remixes have been fetched for a track
  _remixes?: Array<{ track_id: ID }>
  _remixes_count?: number

  // Present iff remix parents have been fetched for a track
  _remix_parents?: Array<{ track_id: ID }>
  // Present iff the track has been cosigned
  _co_sign?: Remix | null
} & OnChain &
  TrackMetadata

export type UserTrack = Track & {
  user: User
}

export type LineupTrack = UserTrack & {
  uid: UID
}

// Track with known non-optional stem
export type StemTrack = Track & Required<Pick<Track, 'stem_of'>>
export type StemUserTrack = UserTrack & Required<Pick<Track, 'stem_of'>>

// Track with known non-optional remix parent
export type RemixTrack = Track & Required<Pick<Track, 'remix_of'>>
export type RemixUserTrack = UserTrack & Required<Pick<Track, 'remix_of'>>

export default Track
