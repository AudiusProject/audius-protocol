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
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { Transition } from 'react-spring/renderprops.cjs'

import { make } from 'common/store/analytics/actions'
import PlaylistTileDesktop from 'components/track/desktop/ConnectedPlaylistTile'
import TrackTileDesktop from 'components/track/desktop/ConnectedTrackTile'
import PlaylistTileMobile from 'components/track/mobile/ConnectedPlaylistTile'
import TrackTileMobile from 'components/track/mobile/ConnectedTrackTile'
import {
  TrackTileProps,
  PlaylistTileProps,
  TrackTileSize,
  TileProps
} from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './Lineup.module.css'
import { delineateByTime, delineateByFeatured } from './delineate'
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

  /**
   * Indicator if a track should be displayed differently (ie. artist pick)
   * The leadingElementId is displayed at the top of the lineup
   */
  leadingElementId?: ID

  /**
   * JSX Element that can be used to delineate the leading element from the rest
   */
  leadingElementDelineator?: JSX.Element | null

  /**
   * Track tile properties to optionally pass to the leading element track tile
   */
  leadingElementTileProps?: Partial<TileProps>

  /**
   * Class name to optionally apply to the leading element
   */
  leadingElementClassName?: string

  /**
   * Class name to optionally apply to the container after the leading element
   */
  laggingContainerClassName?: string

  /**
   * Whether or not to animate the sliding in of the leading element
   */
  animateLeadingElement?: boolean

  /**
   * Whether or not to apply leading element tile props and styles to the
   * skeleton tile rendered in its place
   */
  applyLeadingElementStylesToSkeleton?: boolean

  /**
   * Extra content that preceeds the lineup to be rendered. Can be anything,
   * but is not tied to playback or other lineup pagination logic.
   */
  extraPrecedingElement?: JSX.Element

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
  loadMoreThreshold?: number
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

const DEFAULT_LOAD_MORE_THRESHOLD = 700 // px

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
  leadingElementId,
  leadingElementDelineator,
  leadingElementTileProps,
  leadingElementClassName,
  laggingContainerClassName,
  animateLeadingElement,
  extraPrecedingElement,
  lineupContainerStyles,
  tileContainerStyles,
  tileStyles,
  playingTrackId,
  emptyElement,
  numPlaylistSkeletonRows,
  isTrending = false,
  onClickTile,
  pageSize,
  initialPageSize,
  scrollParent: externalScrollParent,
  loadMoreThreshold = DEFAULT_LOAD_MORE_THRESHOLD
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

  let tiles = lineup.entries
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
          isLoading: lineup.entries[index] === undefined,
          isTrending,
          onClick: onClickTile,
          source: ModalSource.LineUpTrackTile
        }
        if (entry.id === leadingElementId) {
          Object.assign(trackProps, leadingElementTileProps)
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
          isLoading: lineup.entries[index] === undefined,
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

  if (extraPrecedingElement) {
    tiles.unshift(extraPrecedingElement)
  }

  let featuredTiles: any[] = []
  if (leadingElementId) {
    const { featured, remaining } = delineateByFeatured(
      tiles,
      leadingElementId,
      isMobile,
      styles.featuredDelineate,
      leadingElementDelineator
    )
    tiles = remaining
    featuredTiles = featured
  }

  const allTiles = featuredTiles.concat(tiles)
  const featuredTrackUid =
    featuredTiles.length > 0 ? featuredTiles[0].props.uid : null
  const allTracks = allTiles.reduce((acc: Record<string, any>, track) => {
    acc[track.props.uid] = track
    return acc
  }, {})

  return (
    <>
      <div
        className={cn(lineupStyle, {
          [lineupContainerStyles!]: !!lineupContainerStyles
        })}
        style={{ position: 'relative' }}
      >
        <Transition
          items={featuredTrackUid}
          from={{ opacity: 0, marginBottom: 0, maxHeight: 0 }}
          initial={{
            opacity: 1,
            marginBottom: 12,
            maxHeight: 174
          }}
          enter={{
            opacity: 1,
            marginBottom: 12,
            maxHeight: 174
          }}
          leave={{ opacity: 0, marginBottom: 0, maxHeight: 0 }}
          config={{ duration: 175 }}
          immediate={isMobile || !animateLeadingElement}
        >
          {(featuredId: ID | null) =>
            featuredId
              ? (props) => (
                  <div
                    className={cn(
                      styles.featuredContainer,
                      leadingElementClassName
                    )}
                    style={{
                      height: '100%',
                      maxHeight: props.maxHeight,
                      marginBottom: props.marginBottom
                    }}
                  >
                    <div
                      className={styles.featuredContent}
                      style={{
                        height: '100%',
                        opacity: props.opacity,
                        maxHeight: props.maxHeight
                      }}
                    >
                      {allTracks[featuredId]}
                    </div>
                  </div>
                )
              : () => null
          }
        </Transition>
        <div
          ref={scrollContainer}
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
          className={cn({
            [laggingContainerClassName!]: !!laggingContainerClassName
          })}
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
              loader={renderSkeletons(pageSize)}
              threshold={loadMoreThreshold}
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
