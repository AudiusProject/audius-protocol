import { Status } from '@audius/common/models'

import DesktopPlaylistTile from 'components/track/desktop/ConnectedPlaylistTile'
import DesktopTrackTile from 'components/track/desktop/ConnectedTrackTile'
import MobilePlaylistTile from 'components/track/mobile/ConnectedPlaylistTile'
import MobileTrackTile from 'components/track/mobile/ConnectedTrackTile'
import { useIsMobile } from 'hooks/useIsMobile'

import LineupProvider, { LineupProviderProps } from './LineupProvider'
import { LineupVariant } from './types'

export type LineupProps = Omit<
  LineupProviderProps,
  'trackTile' | 'skeletonTile' | 'playlistTile'
>

const defaultLineup = {
  entries: [] as any[],
  order: {},
  total: 0,
  deleted: 0,
  nullCount: 0,
  status: Status.LOADING,
  hasMore: true,
  inView: true,
  prefix: '',
  page: 0,
  isMetadataLoading: false
}

/** A lineup renders a LineupProvider, injecting different tiles
 * depending on the client state.
 */
const Lineup = ({
  lineup = defaultLineup,
  start = 0,
  playing = false,
  variant = LineupVariant.MAIN,
  selfLoad = true,
  delineate = false,
  loadMore = () => {},
  ordered = false,
  setInView,
  ...otherProps
}: LineupProps) => {
  const isMobile = useIsMobile()
  const trackTile =
    isMobile || variant === LineupVariant.SECTION
      ? MobileTrackTile
      : DesktopTrackTile
  const playlistTile = isMobile ? MobilePlaylistTile : DesktopPlaylistTile

  const providerProps = {
    lineup,
    start,
    playing,
    variant,
    selfLoad,
    delineate,
    loadMore,
    ordered,
    setInView,
    trackTile,
    playlistTile,
    ...otherProps
  }

  return <LineupProvider {...providerProps} />
}

export default Lineup
