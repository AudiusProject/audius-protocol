import { ID } from '../../models/Identifiers'

/** A minimal record of a collection saved to an account. Can be used to fetch
 * a full Collection record if extended metadata is needed.
 */
export type AccountCollection = {
  id: ID
  name: string
  is_album: boolean
  user: { id: ID; handle: string }
  permalink: string
}

type AccountPayload<Profile> = {
  uuid: string
  profile: Profile
}

export type TwitterAccountPayload = AccountPayload<TwitterProfile>
export type InstagramAccountPayload = AccountPayload<InstagramProfile>
export type TikTokAccountPayload = AccountPayload<TikTokProfile>

export type InstagramProfile = {
  id: string
  username: string
  biography?: string
  business_email?: string
  edge_follow?: { count: number }
  edge_followed_by?: { count: number }
  external_url?: string
  full_name?: string
  is_business_account?: boolean
  is_private?: boolean
  is_verified: boolean
  profile_pic_url?: string
  profile_pic_url_hd?: string
}

export type TwitterProfile = {
  screen_name: string
  name: string
  verified: boolean
  profile_image_url_https: string
  profile_banner_url?: string
}

export type TikTokProfile = {
  open_id: string
  username: string
  display_name: string
  avatar_large_url?: string
  is_verified: boolean
}
