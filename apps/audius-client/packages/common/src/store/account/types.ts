import { ID } from '../../models/Identifiers'

export type AccountCollection = {
  id: ID
  name: string
  is_album: boolean
  user: { id: ID; handle: string }
}

export type TwitterAccountPayload = {
  uuid: string
  profile: TwitterProfile
}

export type InstagramAccountPayload = {
  uuid: string
  profile: InstagramProfile
}

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

export type AccountImage = { url: string; file: any }

export type NativeAccountImage = {
  uri: string
  name: string
  type?: string
}
