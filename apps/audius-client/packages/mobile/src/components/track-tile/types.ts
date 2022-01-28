import { PlaybackSource } from 'audius-client/src/common/models/Analytics'
import { ID, UID } from 'audius-client/src/common/models/Identifiers'

export type TileProps = {
  /** Index of track in lineup */
  index: number

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Function to call when track & art has loaded */
  onLoad?: (index: number) => void

  /** Whether to show an icon indicating rank in lineup */
  showRankIcon?: boolean

  /** Function to call when play is toggled */
  togglePlay: (uid: UID, trackId: ID, source?: PlaybackSource) => void

  /** Uid of the track or collection */
  uid: UID
}

export type TrackTileProps = TileProps & {
  /** Whether or not to show the artist pick indicators */
  showArtistPick?: boolean
}
