import { CID, ID, UID } from 'models/common/Identifiers'
import { CoverArtSizes } from 'models/common/ImageSizes'
import Repost from 'models/Repost'
import User, { UserMetadata } from './User'
import Favorite from './Favorite'
import { ReactNode } from 'react'
import { UserTrackMetadata } from './Track'
import { Nullable } from '../utils/typeUtils'

export enum Variant {
  USER_GENERATED = 'user-generated',
  SMART = 'smart'
}

type PlaylistContents = {
  track_ids: Array<{ time: number; track: ID }>
}

export type CollectionImage = {
  cover_art: Nullable<CID>
  cover_art_sizes: Nullable<CID>
}

export type CollectionMetadata = CollectionImage & {
  blocknumber: number
  variant: Variant.USER_GENERATED
  description: Nullable<string>
  followee_reposts: Repost[]
  followee_saves: Favorite[]
  has_current_user_reposted: boolean
  has_current_user_saved: boolean
  is_album: boolean
  is_delete: boolean
  is_private: boolean
  playlist_contents: {
    track_ids: Array<{ time: number; track: ID; uid?: UID }>
  }
  tracks?: UserTrackMetadata[]
  playlist_id: ID
  playlist_name: string
  playlist_owner_id: ID
  repost_count: number
  save_count: number
  upc?: Nullable<string>
  updated_at: string
  activity_timestamp?: string
}

export type ComputedCollectionProperties = {
  _is_publishing?: boolean
  _marked_deleted?: boolean
  _cover_art_sizes: CoverArtSizes
  _moved?: UID
}

export type Collection = CollectionMetadata & ComputedCollectionProperties

export default Collection

export type UserCollectionMetadata = CollectionMetadata & { user: UserMetadata }

export type UserCollection = Collection & {
  user: User
}

export type SmartCollection = {
  variant: Variant.SMART
  playlist_name: string
  description?: string
  gradient?: string
  shadow?: string
  icon?: ReactNode
  link: string
  playlist_contents?: PlaylistContents
  has_current_user_saved?: boolean
}
