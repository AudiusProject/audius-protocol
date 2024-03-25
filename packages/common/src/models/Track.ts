import { License } from '~/utils/creativeCommons'

import { Nullable } from '../utils/typeUtils'

import { Chain } from './Chain'
import { Favorite } from './Favorite'
import { CID, ID, UID } from './Identifiers'
import { CoverArtSizes, CoverArtSizesCids } from './ImageSizes'
import { Repost } from './Repost'
import { StemCategory } from './Stems'
import { Timestamped } from './Timestamped'
import { User, UserMetadata } from './User'

type EpochTimeStamp = number

export interface TrackSegment {
  duration: string
  multihash: CID
}

export interface Followee extends User {
  is_delete: boolean
  repost_item_id: string
  repost_type: string
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

// Gated content
export type TokenStandard = 'ERC721' | 'ERC1155'

export type AccessConditionsEthNFTCollection = {
  chain: Chain.Eth
  standard: TokenStandard
  address: string
  name: string
  slug: string
  imageUrl: Nullable<string>
  externalLink: Nullable<string>
}

export type AccessConditionsSolNFTCollection = {
  chain: Chain.Sol
  address: string
  name: string
  imageUrl: Nullable<string>
  externalLink: Nullable<string>
}

// nft_collection can be undefined during upload flow when user has set track to
// collectible-gated but hasn't specified collection yet, but should always be defined
// after user has set the collection.
export type CollectibleGatedConditions = {
  nft_collection:
    | AccessConditionsEthNFTCollection
    | AccessConditionsSolNFTCollection
    | undefined
}

export type FollowGatedConditions = { follow_user_id: number }

export type TipGatedConditions = { tip_user_id: number }

export type USDCPurchaseConditions = {
  usdc_purchase: {
    price: number
    splits: Record<ID, number>
  }
}

export type AccessConditions =
  | CollectibleGatedConditions
  | FollowGatedConditions
  | TipGatedConditions
  | USDCPurchaseConditions

export type AccessPermissions = {
  stream: boolean
  download: boolean
}

export enum GatedContentType {
  COLLECTIBLE_GATED = 'collectible gated',
  SPECIAL_ACCESS = 'special access',
  USDC_PURCHASE = 'usdc purchase'
}

export enum TrackAccessType {
  PUBLIC = 'public',
  TIP_GATED = 'tip_gated',
  FOLLOW_GATED = 'follow_gated',
  COLLECTIBLE_GATED = 'collectible_gated',
  USDC_GATED = 'usdc_gated'
}

export const isContentCollectibleGated = (
  gatedConditions?: Nullable<AccessConditions>
): gatedConditions is {
  nft_collection:
    | AccessConditionsEthNFTCollection
    | AccessConditionsSolNFTCollection
} => 'nft_collection' in (gatedConditions ?? {})

export const isContentFollowGated = (
  gatedConditions?: Nullable<AccessConditions>
): gatedConditions is FollowGatedConditions =>
  'follow_user_id' in (gatedConditions ?? {})

export const isContentTipGated = (
  gatedConditions?: Nullable<AccessConditions>
): gatedConditions is TipGatedConditions =>
  'tip_user_id' in (gatedConditions ?? {})

export const isContentUSDCPurchaseGated = (
  gatedConditions?: Nullable<AccessConditions>
): gatedConditions is USDCPurchaseConditions =>
  'usdc_purchase' in (gatedConditions ?? {})

export type AccessSignature = {
  data: string
  signature: string
}

export type NFTAccessSignature = {
  mp3: AccessSignature
  original: AccessSignature
}

export type EthCollectionMap = {
  [slug: string]: {
    name: string
    address: string
    standard: TokenStandard
    img: Nullable<string>
    externalLink: Nullable<string>
  }
}

export type SolCollectionMap = {
  [mint: string]: {
    name: string
    img: Nullable<string>
    externalLink: Nullable<string>
  }
}

export type GatedTrackStatus = null | 'UNLOCKING' | 'UNLOCKED' | 'LOCKED'

export type ResourceContributor = {
  name: string
  roles: [string]
  sequence_number: number
}

export type RightsController = {
  name: string
  roles: [string]
  rights_share_unknown?: string
}

export type Copyright = {
  year: string
  text: string
}

export type TrackMetadata = {
  ai_attribution_user_id?: Nullable<number>
  blocknumber: number
  activity_timestamp?: string
  is_delete: boolean
  track_id: number
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
  license: Nullable<License>
  mood: Nullable<string>
  play_count: number
  owner_id: ID
  release_date: Nullable<string>
  repost_count: number
  save_count: number
  tags: Nullable<string>
  title: string
  track_segments: TrackSegment[]
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
  cover_art_cids?: Nullable<CoverArtSizesCids>
  is_scheduled_release: boolean
  is_unlisted: boolean
  is_available: boolean
  is_stream_gated: boolean
  stream_conditions: Nullable<AccessConditions>
  is_download_gated: boolean
  download_conditions: Nullable<AccessConditions>
  access: AccessPermissions
  field_visibility?: FieldVisibility
  listenCount?: number
  permalink: string
  track_cid: Nullable<CID>
  orig_file_cid: Nullable<CID>
  orig_filename: Nullable<string>
  is_downloadable: boolean
  is_original_available: boolean
  ddex_app?: Nullable<string>
  ddex_release_ids?: any | null
  artists?: [ResourceContributor] | null
  resource_contributors?: [ResourceContributor] | null
  indirect_resource_contributors?: [ResourceContributor] | null
  rights_controller?: RightsController | null
  copyright_line?: Copyright | null
  producer_copyright_line?: Copyright | null
  parental_warning_type?: string | null

  // Optional Fields
  is_playlist_upload?: boolean
  is_invalid?: boolean
  stem_of?: {
    parent_track_id: ID
    category: StemCategory
  }
  remix_of: Nullable<RemixOf>
  preview_cid?: Nullable<CID>
  preview_start_seconds?: Nullable<number>

  // Added fields
  dateListened?: string
  duration: number

  offline?: OfflineTrackMetadata
  local?: boolean
} & Timestamped

export type DownloadReason = {
  is_from_favorites?: boolean
  collection_id: ID | string
}

// This is available on mobile for offline tracks
export type OfflineTrackMetadata = {
  reasons_for_download: DownloadReason[]
  download_completed_time?: EpochTimeStamp
  last_verified_time?: EpochTimeStamp
  favorite_created_at?: string
}

export type Stem = {
  track_id: ID
  category: StemCategory
  orig_filename: string
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

export type TrackImage = Pick<
  Track,
  'cover_art' | 'cover_art_sizes' | 'cover_art_cids'
>
