import { CID, ID, UID } from 'models/common/Identifiers'
import { CoverArtSizes } from 'models/common/ImageSizes'
import OnChain from 'models/common/OnChain'
import Timestamped from 'models/common/Timestamped'
import Repost from 'models/Repost'
import User from './User'
import Favorite from './Favorite'
import { ReactNode } from 'react'

export enum Variant {
  USER_GENERATED = 'user-generated',
  SMART = 'smart'
}

type PlaylistContents = {
  track_ids: Array<{ time: number; track: ID }>
}

type Collection = OnChain &
  Timestamped & {
    variant: Variant.USER_GENERATED
    description: string | undefined
    followee_reposts: Repost[]
    followee_saves: Favorite[]
    has_current_user_reposted: boolean
    has_current_user_saved: boolean
    is_album: boolean
    is_current: boolean
    is_delete: boolean
    is_private: boolean
    playlist_contents: {
      track_ids: Array<{ time: number; track: ID; uid: UID }>
    }
    playlist_id: ID
    playlist_image_multihash: CID | null
    playlist_name: string
    playlist_owner_id: ID
    repost_count: number
    save_count: number
    upc: string | null
    updated_at: string
    cover_art_url: string
    _is_publishing?: boolean
    _marked_deleted?: boolean
    _cover_art_sizes: CoverArtSizes
    _moved?: UID
    activity_timestamp?: string
  }

export default Collection

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
