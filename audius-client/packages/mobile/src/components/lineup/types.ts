import { ID, UID } from 'audius-client/src/common/models/Identifiers'
import Kind from 'audius-client/src/common/models/Kind'
import { Lineup as LineupData } from 'audius-client/src/common/models/Lineup'
import { LineupActions } from 'audius-client/src/common/store/lineup/actions'
import { Maybe } from 'audius-client/src/common/utils/typeUtils'
import { SectionListProps } from 'react-native'

export enum LineupVariant {
  MAIN = 'main',
  PLAYLIST = 'playlist'
}

export type LineupItem = {
  id: ID
  kind: Kind
  track_id?: ID
  playlist_id?: ID
  uid: UID
  _marked_deleted?: boolean
  activityTimestamp?: Maybe<number | string>
}

export type LoadingLineupItem = {
  _loading: true
}

export type LineupProps = {
  /** Object containing lineup actions such as setPage */
  actions: LineupActions

  /** The maximum number of total tracks to fetch */
  count?: number

  /**
   * Whether or not to delineate the lineup by time of the `activityTimestamp`
   */
  delineate?: boolean

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /**
   * Indicator if a track should be displayed differently (ie. artist pick)
   * The leadingElementId is displayed at the top of the lineup
   */
  leadingElementId?: ID

  /** The number of tracks to fetch in each request */
  limit?: number

  /**
   * The Lineup object containing entries
   */
  lineup: LineupData<LineupItem>

  /**
   * Function called to load more entries
   */
  loadMore?: (offset: number, limit: number, overwrite: boolean) => void

  /**
   * A header to display at the top of the lineup,
   * will scroll with the rest of the content
   */
  header?: SectionListProps<any>['ListHeaderComponent']

  /**
   * Function called on refresh
   */
  refresh?: () => void

  /**
   * Boolean indicating if currently fetching data for a refresh
   * Must be provided if `refresh` is provided
   */
  refreshing?: boolean

  /**
   * How many icons to show for top ranked entries in the lineup. Defaults to 0, showing none
   */
  rankIconCount?: number

  /**
   * Is the lineup responsible for initially fetching it's own data
   */
  selfLoad?: boolean

  /**
   * Whether to show the artist pick on the leading element.
   * Defaults to true.
   */
  showLeadingElementArtistPick?: boolean

  /**
   * Which item to start the lineup at (previous items will not be rendered)
   */
  start?: number

  /**
   * The variant of the Lineup
   */
  variant?: LineupVariant

  /**
   * Uniquely identifies Lineup's SectionList. Needed if rendered inside
   * another VirtualizedList.
   */
  listKey?: string
}
