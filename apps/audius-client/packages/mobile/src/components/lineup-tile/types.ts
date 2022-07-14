import { ReactNode } from 'react'

import type { ID, UID } from '@audius/common'
import { PlaybackSource } from 'audius-client/src/common/models/Analytics'
import { Collection } from 'audius-client/src/common/models/Collection'
import { FavoriteType } from 'audius-client/src/common/models/Favorite'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'

import { GestureResponderHandler } from 'app/types/gesture'

export type LineupItemProps = {
  /** Index of tile in lineup */
  index: number

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Is this item unlisted (hidden)? */
  isUnlisted?: boolean

  /** Function to call when item & art has loaded */
  onLoad?: (index: number) => void

  /** Whether or not to show the artist pick indicators */
  showArtistPick?: boolean

  /** Whether to show an icon indicating rank in lineup */
  showRankIcon?: boolean

  /** Function that will toggle play of a track */
  togglePlay: (args: {
    uid: UID
    id: ID
    source: PlaybackSource
    isPlaying: boolean
    isPlayingUid: boolean
  }) => void

  /** Uid of the item */
  uid: UID
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

  /** ID of the item */
  id: ID

  /** Url of the image */
  imageUrl?: string

  /** Does the tile uid match the playing uid */
  isPlayingUid: boolean

  /** The item (track or collection) */
  item: Track | Collection

  /** Function to call when tile is pressed */
  onPress?: (args: { isPlaying: boolean }) => void

  /** Function to call when the overflow menu button is pressed */
  onPressOverflow?: GestureResponderHandler

  /** Function to call when repost is pressed */
  onPressRepost?: GestureResponderHandler

  /** Function to call when save is pressed */
  onPressSave?: GestureResponderHandler

  /** Function to call when share is pressed */
  onPressShare?: GestureResponderHandler

  /** Function to call when the title is pressed */
  onPressTitle?: GestureResponderHandler

  /** Amount of plays on this item */
  playCount?: number

  /** Repost type used for the reposted user list */
  repostType: RepostType

  /** Title of the item */
  title: string

  /** User associated with the item */
  user: User
}
