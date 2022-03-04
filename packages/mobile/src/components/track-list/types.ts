import { ID } from 'audius-client/src/common/models/Identifiers'
import { CoverArtSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'

export type ListTrackMetadata = {
  isLoading: boolean
  isSaved?: boolean
  isReposted?: boolean
  isActive?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  artistHandle: string
  artistName: string
  trackTitle: string
  trackId: ID
  uid?: string
  time?: number
  coverArtSizes?: CoverArtSizes
  isDeleted: boolean
  user: User
  has_current_user_reposted?: boolean
  has_current_user_saved?: boolean
}
