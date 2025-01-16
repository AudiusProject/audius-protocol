import { ChangeEvent, MouseEventHandler } from 'react'

import {
  AccessConditions,
  AccessPermissions,
  ID,
  Variant
} from '@audius/common/models'
import { CollectionsPageType } from '@audius/common/store'
import { IconComponent } from '@audius/harmony'

export type CollectionHeaderProps = {
  isStreamGated: boolean | null
  isPlayable: boolean
  isPublished: boolean
  tracksLoading: boolean
  loading: boolean
  playing: boolean
  previewing: boolean
  isOwner: boolean
  isAlbum: boolean
  access: AccessPermissions | null
  collectionId: ID
  ownerId: ID | null
  type: CollectionsPageType | 'Playlist' | 'Audio NFT Playlist'
  title: string
  artistName: string
  description: string
  artistHandle: string
  releaseDate: string | number // either format should be utc time
  lastModifiedDate?: string | number // either format should be utc time
  numTracks: number
  duration: number
  variant: Variant | null
  gradient?: string
  icon: IconComponent | null
  imageOverride?: string
  userId: ID | null
  reposts: number
  saves: number
  streamConditions: AccessConditions | null
  onClickReposts?: () => void
  onClickFavorites?: () => void
  onPlay: MouseEventHandler<HTMLButtonElement>
  onPreview: MouseEventHandler<HTMLButtonElement>
  onFilterChange?: (e: ChangeEvent<HTMLInputElement>) => void
}
