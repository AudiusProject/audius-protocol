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
    cover_photo: CoverPhoto
    followee_count: number
    follower_count: number
    handle: string
    id: string
    is_verified: boolean
    location: string
    name: string
    playlist_count: number
    profile_picture: ProfilePicture
    repost_count: number
    track_count: number
    is_deactivated: boolean
}

export type FullUser = User & {
  balance: string
  associated_wallets_balance: string
  total_balance: string
  associated_sol_wallets_balance: string
  blocknumber: number
  wallet: string
  created_at: string
  creator_node_endpoint: string
  current_user_followee_follow_count: number
  does_current_user_follow: boolean
  handle_lc: string
  is_creator: boolean
  updated_at: string
  cover_photo_sizes: string
  cover_photo_legacy: string
  profile_picture_sizes: string
  profile_picture_legacy: string
  metadata_multihash: string
  has_collectibles: boolean
  playlist_library: any
}
