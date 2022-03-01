import { Nullable } from 'audius-client/src/common/utils/typeUtils'

export type Image = {
  height?: number
  width?: number
  name?: string
  size?: number
  fileType?: string
  url: string
  file?: string
}

export type ProfileValues = {
  name: string
  bio: Nullable<string>
  location: Nullable<string>
  twitter_handle: Nullable<string>
  instagram_handle: Nullable<string>
  tiktok_handle: Nullable<string>
  website: Nullable<string>
  donation: Nullable<string>
  cover_photo: Image
  profile_picture: Image
}

export type UpdatedProfile = Omit<
  ProfileValues,
  'cover_photo' | 'profile_picture'
> & {
  updatedCoverPhoto?: Image
  updatedProfilePicture?: Image
}
