import type { User } from '@audius/common/models'

export type UserImage = Pick<
  User,
  | 'cover_photo'
  | 'cover_photo_sizes'
  | 'cover_photo_cids'
  | 'profile_picture'
  | 'profile_picture_sizes'
  | 'profile_picture_cids'
>

export type UserMultihash = Pick<
  User,
  'metadata_multihash' | 'creator_node_endpoint'
>
