
// The general case models come from the "/v1" routes
export type ProfilePicture = {
  ['150x150']: string
  ['480x480']: string
  ['1000x1000']: string
}

export type CoverPhoto = {
  ['640x']: string
  ['2000x']: string
}

export type User = {
  album_count: number
  bio: string
  cover_photo: CoverPhoto | null
  followee_count: number
  follower_count: number
  handle: string
  id: string
  is_deactivated: boolean
  is_verified: boolean
  location: string
  name: string
  playlist_count: number
  profile_picture: ProfilePicture | null
  repost_count: number
  track_count: number
}

// Prefixed with "full", these models come from the "v1/full" route
export type FullUser = User & {
  associated_sol_wallets_balance: string
  associated_wallets_balance: string
  balance: string
  blocknumber: number
  cover_photo_legacy: string | null
  cover_photo_sizes: string
  created_at: string
  creator_node_endpoint: string
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  handle_lc: string
  has_collectibles: boolean
  is_creator: boolean
  metadata_multihash: string
  playlist_library: PlaylistLibrary
  profile_picture_legacy: string | null
  profile_picture_sizes: string
  total_balance: string
  updated_at: string
  wallet: string
}

// Suffixed with "model", these types come from the non-v1 API routes
export type UserModel = {
  bio: string
  blockhash: string
  blocknumber: number
  cover_photo_sizes: string
  cover_photo: null
  created_at: string
  creator_node_endpoint: string
  handle_lc: string
  handle: string
  has_collectibles: boolean
  is_creator: boolean
  is_current: boolean
  is_deactivated: boolean
  is_verified: boolean
  location: string
  metadata_multihash: string
  name: string
  playlist_library: PlaylistLibrary
  primary_id: number
  profile_picture_sizes: string
  profile_picture: null
  replica_set_update_signer: string
  secondary_ids: number[]
  txhash: string
  updated_at: string
  user_id: number
  wallet: string
} & ComputedUserProps

type ComputedUserProps = {
  // Aggregate User
  album_count: number
  followee_count: number
  follower_count: number
  playlist_count: number
  repost_count: number
  track_blocknumber: number
  track_count: number
  track_save_count: number
  user_balance: string,

  // Current User
  current_user_followee_follow_count: number
  does_current_user_follow: boolean

  // Wallets
  associated_sol_wallets_balance: string
  associated_wallets_balance: string
  balance: string
  total_balance: string
}

export type PlaylistLibrary = {
  contents: Array<{
    playlist_id: number
    type: string
  }>
}
