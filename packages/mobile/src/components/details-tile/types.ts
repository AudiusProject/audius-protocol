import type { ReactNode } from 'react'

import type { Track, User } from '@audius/common'
import type { TextStyle } from 'react-native'

import type { SearchUser } from 'app/store/search/types'
import type { GestureResponderHandler } from 'app/types/gesture'

export type DetailsTileDetail = {
  icon?: ReactNode
  isHidden?: boolean
  label: string
  value: ReactNode
  valueStyle?: TextStyle
}

export type DetailsTileProps = {
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
  headerText: string

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

  /** Url of the image */
  imageUrl?: string

  /** Is the item playing */
  isPlaying?: boolean

  /** Function to call when the favorites count is pressed */
  onPressFavorites?: GestureResponderHandler

  /** Function to call when the overflow menu button is pressed */
  onPressOverflow?: GestureResponderHandler

  /** Function to call when play button is pressed */
  onPressPlay: GestureResponderHandler

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
  renderImage?: () => ReactNode

  /** Amount of reposts on this item */
  repostCount?: number

  /** Amount of favorites (saves) on this item */
  saveCount?: number

  /** Title of the item */
  title: string

  /** User associated with the item */
  user?: User | SearchUser
}
