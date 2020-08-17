import Color from 'models/common/Color'
import { CID, ID } from 'models/common/Identifiers'
import { CoverPhotoSizes, ProfilePictureSizes } from 'models/common/ImageSizes'
import OnChain from 'models/common/OnChain'
import Timestamped from 'models/common/Timestamped'

export default interface User extends OnChain, Timestamped {
  album_count: number
  bio: string | null
  cover_photo: CID | null
  creator_node_endpoint: string | null
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  followee_count: number
  follower_count: number
  handle: string
  handle_lc: string
  is_creator: boolean
  is_current: boolean
  is_ready: boolean
  is_verified: boolean
  location: string | null
  metadata_multihash: CID | null
  name: string
  playlist_count: number
  profile_picture: CID
  profile_picture_sizes?: CID
  repost_count: number
  track_count: number
  // Only present on the "current" account
  track_save_count?: number
  user_id: number
  wallet: string
  profile_picture_url: string
  cover_photo_url: string
  twitter_handle?: string
  instagram_handle?: string
  website?: string
  donation?: string
  _profile_picture_sizes: ProfilePictureSizes
  _cover_photo_sizes: CoverPhotoSizes
  _collectionIds?: string[]
  _profile_picture_color?: Color
  _artist_pick: ID
}
