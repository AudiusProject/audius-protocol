import { Nullable } from 'audius-client/src/common/utils/typeUtils'

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  uri: string
  file?: string
}

export type ProfileValues = {
  name: string
  bio: Nullable<string>
  location: Nullable<string>
  twitter_handle?: string
  instagram_handle?: string
  tiktok_handle?: string
  website?: string
  donation?: string
  cover_photo: Image
  profile_picture: Image
}
