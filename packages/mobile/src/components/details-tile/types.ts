import type { ReactNode } from 'react'

import type {
  ID,
  SearchUser,
  SearchTrack,
  Track,
  User
} from '@audius/common/models'
import type { TextStyle } from 'react-native'

import type { ImageProps } from '@audius/harmony-native'
import type { GestureResponderHandler } from 'app/types/gesture'

export type DetailsTileDetail = {
  icon?: ReactNode
  isHidden?: boolean
  label: string
  value: ReactNode

  valueStyle?: TextStyle
}

export type DetailsTileProps = {
  /** Id of the collection */
  collectionId?: ID

  /** Cosign information */
  coSign?: Track['_co_sign']

  /** Source for the analytics call when an external link in the description is pressed */
  descriptionLinkPressSource: 'track page' | 'collection page'

  /** Information about the item such as genre, duration, etc */
  details: DetailsTileDetail[]

  /** Description of the item */
  description?: string

  /** Has the current user reposted */
  hasReposted?: boolean

  /** Has the current user saved */
  hasSaved?: boolean

  /** Label to be displayed at the top of the tile */
  headerText?: string

  /** Hide the favorite button */
  hideFavorite?: boolean

  /** Hide the favorite count */
  hideFavoriteCount?: boolean

  /** Hide the listen count */
  hideListenCount?: boolean

  /** Hide the overflow menu button */
  hideOverflow?: boolean

  /** Hide the repost button */
  hideRepost?: boolean

  /** Hide the repost count */
  hideRepostCount?: boolean

  /** Hide the share button */
  hideShare?: boolean

  /** Is the item playing */
  isPlaying?: boolean

  /** Is the currently playing item a preview */
  isPreviewing?: boolean

  /** Is the item loaded and in a playable state */
  isPlayable?: boolean

  /** Is the tile being loaded for a collection */
  isCollection?: boolean

  /** Is the item loaded published */
  isPublished?: boolean

  /** Is the item unlisted (hidden) */
  isUnlisted?: boolean

  /** Is the item a scheduled release */
  isScheduledRelease?: boolean

  /** Function to call when the edit button is pressed */
  onPressEdit?: GestureResponderHandler

  /** Function to call when the favorites count is pressed */
  onPressFavorites?: GestureResponderHandler

  /** Function to call when the overflow menu button is pressed */
  onPressOverflow?: GestureResponderHandler

  /** Function to call when play button is pressed */
  onPressPlay: GestureResponderHandler

  /** Function to call when preview button is pressed */
  onPressPreview?: GestureResponderHandler

  /** Function to call when publish button is pressed */
  onPressPublish?: GestureResponderHandler

  /** Function to call when repost is pressed */
  onPressRepost?: GestureResponderHandler

  /** Function to call when the repost count is pressed */
  onPressReposts?: GestureResponderHandler

  /** Function to call when save is pressed */
  onPressSave?: GestureResponderHandler

  /** Function to call when share is pressed */
  onPressShare?: GestureResponderHandler

  /** Amount of plays on this item */
  playCount?: number

  /** Render function for content below primary details */
  renderBottomContent?: () => ReactNode

  /** Render function for the header */
  renderHeader?: () => ReactNode

  /** Render function for the image */
  renderImage: (props: ImageProps) => ReactNode

  /** Amount of reposts on this item */
  repostCount?: number

  /** Amount of favorites (saves) on this item */
  saveCount?: number

  /** Amount of tracks on this item */
  trackCount?: number

  /** Title of the item */
  title: string

  /** User associated with the item */
  user?: User | SearchUser

  /** The track if tile is for a track */
  track?: Track | SearchTrack
}
