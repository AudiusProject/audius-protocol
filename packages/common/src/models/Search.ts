import { Nullable } from 'utils/typeUtils'

import { CollectionImage } from './Collection'
import { Repost } from './Repost'
import {
  PremiumConditions,
  PremiumContentSignature,
  TrackImage,
  TrackSegment
} from './Track'
import { User, UserImage, UserMultihash } from './User'

type BaseUser = Pick<
  User,
  'name' | 'is_verified' | 'associated_wallets_balance' | 'balance'
>

export type SearchUser = UserMultihash &
  UserImage &
  BaseUser & {
    allow_ai_attribution?: boolean
    album_count: null
    bio: string
    followee_count: null
    follower_count: 3
    handle: string
    is_verified: boolean
    location: string
    name: string
    playlist_count: null
    repost_count: null
    track_count: null
    blocknumber: number
    wallet: string
    created_at: string
    current_user_followee_follow_count: number
    does_current_user_follow: boolean
    handle_lc: string
    updated_at: string
    has_collectibles: boolean
    user_id: number
  }

export type SearchTrack = TrackImage & {
  ai_attribution_user_id?: number
  _co_sign: undefined
  _cover_art_sizes: null
  description: string | null
  genre: string
  mood: string
  release_date: null
  remix_of: null
  repost_count: number
  tags: null
  title: string
  user: SearchUser
  duration: number
  play_count: undefined
  blocknumber: number
  create_date: null
  created_at: string
  credits_splits: null
  download: {
    cid: null
    is_downloadable: false
    requires_follow: false
  }
  isrc: null
  license: null
  iswc: null
  field_visibility: {
    mood: boolean
    tags: boolean
    genre: boolean
    share: boolean
    play_count: boolean
    remixes: null
  }
  followee_reposts: Repost[]
  has_current_user_reposted: undefined
  is_unlisted: boolean
  is_premium: boolean
  premium_conditions: Nullable<PremiumConditions>
  premium_content_signature: Nullable<PremiumContentSignature>
  has_current_user_saved: undefined
  stem_of: null
  updated_at: string
  is_delete: boolean
  track_id: number
  owner_id: number
  followee_saves: []
  save_count: undefined
  track_segments: TrackSegment[]
  followee_favorites: null
  user_id: number
  permalink: string
  parent_album_ids: number[]
  _remixes: undefined
  _remixes_count: undefined
}

export type SearchPlaylist = CollectionImage & {
  _cover_art_sizes: null
  _is_publishing?: boolean
  description: string | null
  is_album: boolean
  playlist_name: string
  repost_count: number
  total_play_count: null
  user: SearchUser
  blocknumber: number
  created_at: string
  followee_reposts: []
  has_current_user_reposted: undefined
  has_current_user_saved: undefined
  is_delete: boolean
  is_private: boolean
  updated_at: string
  tracks: []
  track_count: number
  variant: string
  playlist_id: number
  playlist_owner_id: number
  followee_saves: []
  save_count: undefined
  playlist_contents: {
    track_ids: {
      track: number
      time: number
    }[]
  }
}
