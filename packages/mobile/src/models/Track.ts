import { CID, ID, UID } from 'models/common/Identifiers'
import { CoverArtSizes } from 'models/common/ImageSizes'
import Repost from 'models/Repost'
import User, { UserMetadata } from 'models/User'
import Favorite from 'models/Favorite'
import Timestamped from './common/Timestamped'
import { StemCategory } from './Stems'
import { Nullable } from '../utils/typeUtils'

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
  // TODO: figure out why
  // is_downloadable and requires_follow
  // are randomly null on some tracks
  // returned from the API
  is_downloadable: Nullable<boolean>
  requires_follow: Nullable<boolean>
  cid: Nullable<string>
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

export type TrackImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
}

export type TrackId = {
  track_id: number
  route_id: string
}

export type TrackMetadata = TrackImage & TrackId & {
  blocknumber: number
  activity_timestamp?: string
  is_delete: boolean
  created_at: string
  isrc: Nullable<string>
  iswc: Nullable<string>
  credits_splits: Nullable<string>
  description: Nullable<string>
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  genre: string
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  download: Nullable<Download>
  license: Nullable<string>
  mood: Nullable<string>
  play_count: number
  owner_id: ID
  release_date: Nullable<string>
  repost_count: number
  save_count: number
  tags: Nullable<string>
  title: string
  track_segments: TrackSegment[]
  is_unlisted: boolean
  field_visibility?: FieldVisibility
  listenCount?: number

  // Optional Fields
  is_invalid?: boolean
  stem_of?: {
    parent_track_id: ID
    category: StemCategory
  }
  remix_of: Nullable<RemixOf>

  // Added fields
  dateListened?: string
  duration: number
} & Timestamped

export type Stem = {
  track_id: ID
  category: StemCategory
}

export type ComputedTrackProperties = {
  // All below, added clientside
  _cover_art_sizes: CoverArtSizes
  _first_segment?: string
  _followees?: Followee[]
  _marked_deleted?: boolean
  _is_publishing?: boolean
  _stems?: Stem[]

  // Present iff remixes have been fetched for a track
  _remixes?: Array<{ track_id: ID }>
  _remixes_count?: number
  // Present iff remix parents have been fetched for a track
  _remix_parents?: Array<{ track_id: ID }>
  // Present iff the track has been cosigned
  _co_sign?: Nullable<Remix>

  _blocked?: boolean
}

export type Track = TrackMetadata & ComputedTrackProperties

export type UserTrackMetadata = TrackMetadata & { user: UserMetadata }

export type UserTrack = Track & {
  user: User
}

export type LineupTrack = UserTrack & {
  uid: UID
}

// Track with known non-optional stem
export type StemTrackMetadata = TrackMetadata & Required<Pick<Track, 'stem_of'>>
export type StemTrack = Track & Required<Pick<Track, 'stem_of'>>
export type StemUserTrack = UserTrack & Required<Pick<Track, 'stem_of'>>

// Track with known non-optional remix parent
export type RemixTrack = Track & Required<Pick<Track, 'remix_of'>>
export type RemixUserTrack = UserTrack & Required<Pick<Track, 'remix_of'>>

export default Track
