import { useRef, useEffect, useState, useCallback } from 'react'

import {
  Name,
  PlaybackSource,
  Kind,
  ID,
  UID,
  ModalSource,
  Status
} from '@audius/common/models'
import { LineupQueryData } from '@audius/common/src/api/tan-query/types'
import { LineupBaseActions, playerSelectors } from '@audius/common/store'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import PlaylistTileDesktop from 'components/track/desktop/ConnectedPlaylistTile'
import TrackTileDesktop from 'components/track/desktop/ConnectedTrackTile'
import PlaylistTileMobile from 'components/track/mobile/ConnectedPlaylistTile'
import TrackTileMobile from 'components/track/mobile/ConnectedTrackTile'
import {
  TrackTileProps,
  PlaylistTileProps,
  TrackTileSize
} from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './Lineup.module.css'
import { delineateByTime } from './delineate'
import { LineupVariant } from './types'
const { getUid } = playerSelectors

export interface TanQueryLineupProps {
  /** Query data should be fetched one component above and passed through here */
  lineupQueryData: LineupQueryData

  'aria-label'?: string

  // Other props
  playingUid: UID | null
  playingTrackId: ID | null
  variant?: LineupVariant
  scrollParent?: HTMLElement | null
  endOfLineup?: JSX.Element

  /**
   * Whether or not to delineate the lineup by time of the `activityTimestamp` prop
   */
  delineate?: boolean

  buffering: boolean
  ordered?: boolean
  lineupContainerStyles?: string
  tileContainerStyles?: string
  tileStyles?: string
  setInView?: (inView: boolean) => void
  playingSource: string | null
  emptyElement?: JSX.Element
  actions: LineupBaseActions
  delayLoad?: boolean
  /** How many rows to show for a loading playlist tile. Defaults to 0 */
  numPlaylistSkeletonRows?: number

  /** Are we in a trending lineup? Allows tiles to specialize their rendering */
  isTrending?: boolean

  /** Function triggered on click of tile */
  onClickTile?: (trackId: ID) => void
  pageSize: number
  initialPageSize?: number

  /** Starting index to render from */
  start?: number
}

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

/** `TanQueryLineup` encapsulates the logic for displaying a Lineup (e.g. prefetching items)
 * displaying loading states, etc). This is decoupled from the rendering logic, which
 * is controlled by injecting tiles conforming to `Track/Playlist/SkeletonProps interfaces.
 */
export const TanQueryLineup = ({
  lineupQueryData,
  'aria-label': ariaLabel,
  variant = LineupVariant.MAIN,
  ordered = false,
  delineate = false,
  endOfLineup,
  lineupContainerStyles,
  tileContainerStyles,
  tileStyles,
  playingTrackId,
  setInView,
  emptyElement,
  numPlaylistSkeletonRows,
  isTrending = false,
  onClickTile,
  pageSize,
  initialPageSize,
  scrollParent: externalScrollParent,
  start = 0
}: TanQueryLineupProps) => {
  const dispatch = useDispatch()
  const {
    lineup = defaultLineup,
    play,
    pause,
    loadNextPage,
    hasNextPage,
    isPlaying,
    isFetching,
    isError
  } = lineupQueryData

  const isMobile = useIsMobile()
  const scrollContainer = useRef<HTMLDivElement>(null)
  const playingUid = useSelector(getUid)

  const TrackTile =
    isMobile || variant === LineupVariant.SECTION
      ? TrackTileMobile
      : TrackTileDesktop
  const PlaylistTile = isMobile ? PlaylistTileMobile : PlaylistTileDesktop
  // State hooks
  const [internalScrollParent, setInternalScrollParent] =
    useState<HTMLElement | null>(externalScrollParent || null)

  // Effects
  useEffect(() => {
    if (setInView) setInView(true)
    return () => {
      if (setInView) setInView(false)
    }
  }, [setInView])

  useEffect(() => {
    if (
      externalScrollParent &&
      !internalScrollParent &&
      externalScrollParent !== internalScrollParent
    ) {
      setInternalScrollParent(externalScrollParent)
    }
  }, [externalScrollParent, internalScrollParent, lineup.hasMore, loadNextPage])

  // Callbacks
  const togglePlay = useCallback(
    (uid: UID, trackId: ID, source?: PlaybackSource) => {
      if (uid !== playingUid || (uid === playingUid && !isPlaying)) {
        play(uid)
        dispatch(
          make(Name.PLAYBACK_PLAY, {
            id: `${trackId}`,
            source: source || PlaybackSource.TRACK_TILE
          })
        )
      } else if (uid === playingUid && isPlaying) {
        pause()
        dispatch(
          make(Name.PLAYBACK_PAUSE, {
            id: `${trackId}`,
            source: source || PlaybackSource.TRACK_TILE
          })
        )
      }
    },
    [playingUid, isPlaying, play, dispatch, pause]
  )

  // Render logic
  let tileSize: TrackTileSize
  let lineupStyle = {}
  let containerClassName: string | undefined
  let statSize = 'large'

  if (variant === LineupVariant.MAIN || variant === LineupVariant.PLAYLIST) {
    tileSize = TrackTileSize.LARGE
    lineupStyle = styles.main
  } else if (variant === LineupVariant.GRID) {
    tileSize = TrackTileSize.SMALL
    lineupStyle = styles.section
    statSize = 'small'
    containerClassName = styles.searchTrackTileContainer
  } else if (variant === LineupVariant.CONDENSED) {
    tileSize = TrackTileSize.SMALL
    lineupStyle = styles.section
  }

  // Apply offset and maxEntries to the lineup entries
  const slicedLineup = {
    ...lineup,
    entries:
      pageSize !== undefined
        ? lineup.entries.slice(start, start + pageSize)
        : lineup.entries.slice(start)
  }

  let tiles = slicedLineup.entries
    .map((entry: any, index: number) => {
      if (entry.kind === Kind.TRACKS || entry.track_id) {
        if (entry._marked_deleted) return null

        const trackProps: TrackTileProps = {
          ...entry,
          index,
          ordered,
          togglePlay,
          size: tileSize,
          statSize,
          containerClassName,
          uid: entry.uid,
          isLoading: slicedLineup.entries[index] === undefined,
          isTrending,
          onClick: onClickTile,
          source: ModalSource.LineUpTrackTile
        }
        // @ts-ignore - TODO: these types werent enforced before - something smelly here
        return <TrackTile {...trackProps} key={index} />
      } else if (entry.kind === Kind.COLLECTIONS || entry.playlist_id) {
        const playlistProps: PlaylistTileProps = {
          ...entry,
          index,
          uid: entry.uid,
          size: tileSize,
          ordered,
          playTrack: play,
          pauseTrack: pause,
          playingTrackId,
          togglePlay,
          isLoading: slicedLineup.entries[index] === undefined,
          numLoadingSkeletonRows: numPlaylistSkeletonRows,
          isTrending,
          source: ModalSource.LineUpCollectionTile
        }
        // @ts-ignore - TODO: these types werent enforced before - something smelly here
        return <PlaylistTile {...playlistProps} key={index} />
      }
      return null
    })
    .filter(Boolean)

  // Renders TrackTile skeletons based on the number of tiles to render
  // NOTE: We don't know if the tiles will be a track or a playlist - we default to showing track skeletons
  const renderSkeletons = (skeletonCount: number | undefined) => {
    const skeletonTileProps = (index: number) => ({
      index: tiles.length + index,
      size: tileSize,
      ordered,
      isLoading: true,
      numLoadingSkeletonRows: numPlaylistSkeletonRows
    })

    // This means no skeletons are desired
    if (!skeletonCount) {
      return <></>
    }

    return (
      <>
        {Array(skeletonCount)
          .fill(null)
          .map((_, index) => {
            // @ts-ignore - TODO: these types werent being enforced before - something smelly here
            return <TrackTile {...skeletonTileProps(index)} key={index} />
          })}
      </>
    )
  }

  // On initial load we won't have any data loaded so we show skeletons based on the initial page size
  if (isFetching && tiles.length === 0) {
    return renderSkeletons(initialPageSize ?? pageSize)
  }

  if (isError) {
    tiles = []
  }

  if (delineate) {
    tiles = delineateByTime(tiles, isMobile)
  }

  return (
    <>
      <div
        className={cn(lineupStyle, {
          [lineupContainerStyles!]: !!lineupContainerStyles
        })}
        css={{ width: '100%' }}
      >
        <div
          ref={scrollContainer}
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {tiles.length === 0 && !isFetching ? (
            emptyElement
          ) : (
            <InfiniteScroll
              aria-label={ariaLabel}
              pageStart={0}
              className={cn({
                [tileContainerStyles!]: !!tileContainerStyles
              })}
              loadMore={loadNextPage}
              hasMore={hasNextPage}
              useWindow={isMobile}
              initialLoad={false}
              getScrollParent={() => {
                if (internalScrollParent?.id === 'mainContent') {
                  return document.getElementById('mainContent')
                }
                return internalScrollParent
              }}
              element='ol'
              loader={isFetching ? renderSkeletons(pageSize) : <></>}
            >
              {tiles.map((tile: any, index: number) => (
                <li key={index} className={cn({ [tileStyles!]: !!tileStyles })}>
                  {tile}
                </li>
              ))}
            </InfiniteScroll>
          )}
        </div>
      </div>
      {!hasNextPage && endOfLineup ? endOfLineup : null}
    </>
  )
}
