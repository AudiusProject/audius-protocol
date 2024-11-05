import type { ReactNode } from 'react'

import type {
  PlaybackSource,
  FavoriteType,
  Collection,
  ID,
  UID,
  Track,
  User
} from '@audius/common/models'
import type { RepostType, EnhancedCollectionTrack } from '@audius/common/store'
import type { StyleProp, ViewStyle } from 'react-native'

import type { ImageProps } from '@audius/harmony-native'
import type { GestureResponderHandler } from 'app/types/gesture'

import type { TileProps } from '../core'

/**
 * Optional variant to modify the lineup item features and styles
 * The 'readonly' variant will remove the action buttons on the tile
 */
export type LineupItemVariant = 'readonly'

export enum LineupTileSource {
  DM_COLLECTION = 'DM - Collection',
  DM_TRACK = 'DM - Track',
  LINEUP_COLLECTION = 'Lineup - Collection',
  LINEUP_TRACK = 'Lineup - Track'
}

export type LineupItemProps = {
  /** Index of tile in lineup */
  index: number

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Is this item unlisted (hidden)? */
  isUnlisted?: boolean

  /** Whether or not to show the artist pick indicators */
  showArtistPick?: boolean

  /** Whether to show an icon indicating rank in lineup */
  showRankIcon?: boolean

  /** Function that will toggle play of a track */
  togglePlay: (args: { uid: UID; id: ID; source: PlaybackSource }) => void

  /** Function called when tile title or playback is pressed */
  onPress?: (id: ID) => void

  /** Uid of the item */
  uid: UID

  /** Optionally passed in variant */
  variant?: LineupItemVariant

  /** Optionally passed in collection to override  */
  collection?: Collection

  /** Optionally passed in tracks to override  */
  tracks?: EnhancedCollectionTrack[]

  /** Passed in styles */
  styles?: StyleProp<ViewStyle>

  /** Tell the tile where it's being used */
  source?: LineupTileSource
}

export type LineupTileProps = Omit<LineupItemProps, 'togglePlay'> & {
  children?: ReactNode

  /** Cosign information */
  coSign?: Track['_co_sign']

  /** Duration of the tile's tracks */
  duration?: number

  /** Favorite type used for the favorited user list */
  favoriteType: FavoriteType

  /** Hide the play count */
  hidePlays?: boolean

  /** Hide the share button */
  hideShare?: boolean

  /** Hide the comments stat */
  hideComments?: boolean

  /** ID of the item */
  id: ID

  /** Render function for the image */
  renderImage: (props: ImageProps) => ReactNode

  /** The item (track or collection) */
  item: Track | Collection

  /** Indicates that item has preview content available */
  hasPreview?: boolean

  /** Function to call when tile is pressed */
  onPress?: () => void

  /** Function to call when the overflow menu button is pressed */
  onPressOverflow?: GestureResponderHandler

  /** Function to call when repost button is pressed */
  onPressRepost?: GestureResponderHandler

  /** Function to call when save button is pressed */
  onPressSave?: GestureResponderHandler

  /** Function to call when share button is pressed */
  onPressShare?: GestureResponderHandler

  /** Function to call when the title text is pressed */
  onPressTitle?: GestureResponderHandler

  /** Function to call when the publish button is pressed */
  onPressPublish?: GestureResponderHandler

  /** Function to call when the edit button is pressed */
  onPressEdit?: GestureResponderHandler

  /** Amount of plays on this item */
  playCount?: number

  /** Amount of comments on this item */
  commentCount?: number

  /** Repost type used for the reposted user list */
  repostType: RepostType

  /** Title of the item */
  title: string

  /** User associated with the item */
  user: User

  /** Does the tile uid match the playing uid */
  isPlayingUid: boolean

  TileProps?: Partial<TileProps>

  /** Analytics context about where this tile is being used */
  source?: LineupTileSource

  /** A UID for the lineup - used to trigger track changes within the lineup */
  lineupUid?: string
}
