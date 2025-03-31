import {
  MouseEvent,
  memo,
  useMemo,
  useEffect,
  useCallback,
  ReactChildren,
  useRef
} from 'react'

import {
  Name,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  ID,
  UID,
  Track,
  isContentUSDCPurchaseGated,
  ModalSource
} from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  shareModalUIActions,
  playerSelectors,
  usePremiumContentPurchaseModal,
  PurchaseableContentType
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Text, IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'
import { LocationState } from 'history'
import { range } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { TrackEvent, make } from 'common/store/analytics/actions'
import { Draggable } from 'components/dragndrop'
import { UserLink } from 'components/link'
import { OwnProps as CollectionkMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import { CollectionArtwork } from 'components/track/Artwork'
import { TrackTileSize } from 'components/track/types'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'
import { AppState } from 'store/types'
import { isDescendantElementOf } from 'utils/domUtils'
import { push as pushRoute } from 'utils/navigation'
import { fullCollectionPage, fullTrackPage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import styles from './ConnectedPlaylistTile.module.css'
import PlaylistTile from './PlaylistTile'
import TrackListItem from './TrackListItem'
const { getUid, getBuffering, getPlaying } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getUserFromCollection } = cacheUsersSelectors
const {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} = collectionsSocialActions
const { getCollection, getTracksFromCollection } = cacheCollectionsSelectors
const getUserHandle = accountSelectors.getUserHandle
const { collectionPage } = route

type OwnProps = {
  uid: UID
  ordered: boolean
  index: number
  size: TrackTileSize
  containerClassName?: string
  togglePlay: () => void
  playTrack: (uid: string) => void
  playingTrackId?: ID
  pauseTrack: () => void
  isUploading?: boolean
  isLoading: boolean
  hasLoaded: (index: number) => void
  numLoadingSkeletonRows?: number
  isTrending: boolean
  isFeed: boolean
  source?: ModalSource
}

type ConnectedPlaylistTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedPlaylistTile = ({
  ordered,
  index,
  size,
  collection,
  userHandle,
  containerClassName,
  user,
  tracks,
  togglePlay,
  playTrack,
  pauseTrack,
  playingUid,
  isBuffering,
  isPlaying,
  goToRoute,
  record,
  playingTrackId,
  isLoading,
  numLoadingSkeletonRows,
  isUploading,
  hasLoaded,
  shareCollection,
  repostCollection,
  undoRepostCollection,
  saveCollection,
  unsaveCollection,
  isTrending,
  isFeed = false,
  source
}: ConnectedPlaylistTileProps) => {
  const {
    is_album: isAlbum,
    playlist_name: title,
    playlist_id: id,
    is_private: isUnlisted,
    has_current_user_reposted: isReposted,
    has_current_user_saved: isFavorited,
    track_count: trackCount,
    permalink,
    is_stream_gated: isStreamGated,
    stream_conditions: streamConditions,
    access
  } = getCollectionWithFallback(collection)

  const {
    user_id,
    handle,
    is_deactivated: isOwnerDeactivated
  } = getUserWithFallback(user)
  const isOwner = handle === userHandle

  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = useMemo(() => {
    return tracks.some((track: any) => track.uid === playingUid)
  }, [tracks, playingUid])
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  const onTogglePlay = useCallback(
    (e?: MouseEvent /* click event within TrackTile */) => {
      // Skip playing / pausing track if click event happened within track menu container
      // because clicking on it should not affect corresponding playlist track.
      // We have to do this instead of stopping the event propagation
      // because we need it to bubble up to the document to allow
      // the document click listener to close other track/playlist tile menus
      // that are already open.
      const shouldSkipTogglePlay = isDescendantElementOf(
        e?.target,
        menuRef.current
      )
      if (shouldSkipTogglePlay) return
      if (isUploading) return
      if (!isActive || !isPlaying) {
        if (isActive) {
          playTrack(playingUid!)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${playingTrackId}`,
                source: PlaybackSource.PLAYLIST_TILE_TRACK
              })
            )
          }
        } else {
          const trackUid = tracks[0] ? tracks[0].uid : null
          const trackId = tracks[0] ? tracks[0].track_id : null
          if (!trackUid || !trackId) return
          playTrack(trackUid)
          if (record) {
            record(
              make(Name.PLAYBACK_PLAY, {
                id: `${trackId}`,
                source: PlaybackSource.PLAYLIST_TILE_TRACK
              })
            )
          }
        }
      } else {
        pauseTrack()
        if (record) {
          record(
            make(Name.PLAYBACK_PAUSE, {
              id: `${playingTrackId}`,
              source: PlaybackSource.PLAYLIST_TILE_TRACK
            })
          )
        }
      }
    },
    [
      isPlaying,
      tracks,
      playTrack,
      pauseTrack,
      isActive,
      playingUid,
      playingTrackId,
      isUploading,
      record
    ]
  )

  const href = isLoading
    ? ''
    : collectionPage(handle, title, id, permalink, isAlbum)

  const fullHref = isLoading
    ? ''
    : fullCollectionPage(handle, title, id, permalink, isAlbum)

  const onClickTitle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      goToRoute(href, { forceFetch: true })
    },
    [goToRoute, href]
  )

  useEffect(() => {
    if (!isLoading && hasLoaded) {
      hasLoaded(index)
    }
  }, [hasLoaded, index, isLoading])

  const isPlaylistPlaying = isActive && isPlaying

  const renderImage = useCallback(() => {
    const artworkProps = {
      id,
      size: 'large',
      isBuffering: isBuffering && isActive,
      isPlaying: isPlaylistPlaying,
      artworkIconClassName: styles.artworkIcon,
      showArtworkIcon: !isLoading,
      showSkeleton: isLoading
    }
    return <CollectionArtwork {...artworkProps} />
  }, [id, isActive, isBuffering, isPlaylistPlaying, isLoading])

  const renderOverflowMenu = () => {
    const menu: Omit<CollectionkMenuProps, 'children'> = {
      handle,
      isFavorited,
      isReposted,
      type: isAlbum ? 'album' : 'playlist', // playlist or album
      playlistId: id,
      playlistName: title,
      isPublic: !isUnlisted,
      isOwner,
      includeEmbed: !isUnlisted && !isStreamGated,
      includeShare: true,
      includeRepost: hasStreamAccess,
      includeFavorite: hasStreamAccess,
      includeVisitPage: true,
      extraMenuItems: [],
      permalink: permalink || ''
    }

    return (
      <Menu menu={menu}>
        {(ref, triggerPopup) => (
          <div className={styles.menuContainer} ref={menuRef}>
            <div
              className={styles.menuKebabContainer}
              onClick={() => triggerPopup()}
            >
              <div ref={ref}>
                <IconKebabHorizontal
                  className={cn(styles.iconKebabHorizontal)}
                />
              </div>
            </div>
          </div>
        )}
      </Menu>
    )
  }

  const userName = (
    <Text variant='body' ellipses css={{ display: 'inline-flex', gap: 4 }}>
      <UserLink
        ellipses
        userId={user_id}
        badgeSize='xs'
        isActive={isActive}
        popover
      />
    </Text>
  )

  const onClickFavorite = useCallback(() => {
    if (isFavorited) {
      unsaveCollection(id)
    } else {
      saveCollection(id, isFeed)
    }
  }, [saveCollection, unsaveCollection, id, isFavorited, isFeed])

  const onClickRepost = useCallback(() => {
    if (isReposted) {
      undoRepostCollection(id)
    } else {
      repostCollection(id, isFeed)
    }
  }, [repostCollection, undoRepostCollection, id, isReposted, isFeed])

  const onClickShare = useCallback(() => {
    shareCollection(id)
  }, [shareCollection, id])

  const hasStreamAccess = !!access?.stream

  const onClickGatedUnlockPill = useRequiresAccountOnClick(() => {
    const isPurchase = isContentUSDCPurchaseGated(streamConditions)
    if (isPurchase && id) {
      openPremiumContentPurchaseModal(
        { contentId: id, contentType: PurchaseableContentType.ALBUM },
        { source: source ?? ModalSource.TrackTile }
      )
    }
  }, [id, openPremiumContentPurchaseModal, hasStreamAccess])

  const disableActions = false

  const TileTrackContainer = useCallback(
    ({ children }: { children: ReactChildren }) => (
      <Draggable
        key={id}
        isDisabled={disableActions}
        text={title}
        kind={isAlbum ? 'album' : 'playlist'}
        id={id}
        isOwner={isOwner}
        link={fullHref}
      >
        {children as any}
      </Draggable>
    ),
    [id, disableActions, title, isAlbum, isOwner, fullHref]
  )

  const renderTrackList = useCallback(() => {
    const showSkeletons = !!(
      !tracks.length &&
      isLoading &&
      numLoadingSkeletonRows
    )
    if (showSkeletons) {
      return range(numLoadingSkeletonRows as number).map((i) => (
        <TrackListItem
          index={i}
          key={i}
          isLoading={true}
          isAlbum={isAlbum}
          forceSkeleton
          active={false}
          size={size}
          disableActions={disableActions}
          playing={isPlaying}
          togglePlay={togglePlay}
          goToRoute={goToRoute}
          artistHandle={handle}
        />
      ))
    }
    return tracks.map((track, i) => (
      <Draggable
        key={`${track.title}+${i}`}
        text={track.title}
        kind='track'
        id={track.track_id}
        isOwner={track.user.handle === userHandle}
        link={fullTrackPage(track.permalink)}
      >
        <TrackListItem
          index={i}
          key={`${track.title}+${i}`}
          isLoading={isLoading}
          isAlbum={isAlbum}
          active={playingUid === track.uid}
          size={size}
          disableActions={disableActions}
          playing={isPlaying}
          track={track}
          togglePlay={togglePlay}
          goToRoute={goToRoute}
          artistHandle={handle}
          isLastTrack={i === tracks.length - 1}
        />
      </Draggable>
    ))
  }, [
    tracks,
    isLoading,
    isAlbum,
    userHandle,
    playingUid,
    size,
    disableActions,
    isPlaying,
    togglePlay,
    goToRoute,
    handle,
    numLoadingSkeletonRows
  ])

  const artwork = renderImage()
  const rightActions = renderOverflowMenu()
  const trackList = renderTrackList()

  const order = ordered && index !== undefined ? index + 1 : undefined
  const header =
    size === TrackTileSize.LARGE ? (isAlbum ? 'ALBUM' : 'PLAYLIST') : undefined

  // Failsafe check - should never get this far, lineups should filter deactivated playlists
  if (isOwnerDeactivated) {
    return null
  }
  return (
    <PlaylistTile
      // Track Tile Props
      size={size}
      order={order}
      isFavorited={isFavorited}
      isReposted={isReposted}
      isOwner={isOwner}
      isLoading={isLoading}
      numLoadingSkeletonRows={numLoadingSkeletonRows}
      isDarkMode={isDarkMode()}
      isMatrixMode={isMatrix()}
      isActive={isActive}
      isPlaying={isPlaylistPlaying}
      artwork={artwork}
      rightActions={rightActions}
      title={title}
      userName={userName}
      header={header}
      onClickTitle={onClickTitle}
      onClickRepost={onClickRepost}
      onClickFavorite={onClickFavorite}
      onClickShare={onClickShare}
      onClickGatedUnlockPill={onClickGatedUnlockPill}
      onTogglePlay={onTogglePlay}
      key={`${index}-${title}`}
      TileTrackContainer={TileTrackContainer}
      duration={tracks.reduce(
        (duration: number, track: Track) => duration + track.duration,
        0
      )}
      containerClassName={cn(styles.container, {
        [containerClassName!]: !!containerClassName,
        [styles.loading]: isLoading,
        [styles.active]: isActive,
        [styles.small]: size === TrackTileSize.SMALL,
        [styles.large]: TrackTileSize.LARGE
      })}
      tileClassName={cn(styles.trackTile)}
      tracksContainerClassName={cn(styles.tracksContainer)}
      trackList={trackList}
      trackCount={trackCount}
      isTrending={isTrending}
      href={href}
      hasStreamAccess={hasStreamAccess}
      streamConditions={isStreamGated ? streamConditions : null}
      source={source}
      playlistId={id}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { uid: ownProps.uid }),
    tracks: getTracksFromCollection(state, { uid: ownProps.uid }),
    user: getUserFromCollection(state, { uid: ownProps.uid }),
    userHandle: getUserHandle(state),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string, state?: LocationState) =>
      dispatch(pushRoute(route, state)),
    record: (event: TrackEvent) => dispatch(event),
    shareCollection: (id: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: id,
          source: ShareSource.TILE
        })
      ),
    repostCollection: (id: ID, isFeed: boolean) =>
      dispatch(repostCollection(id, RepostSource.TILE, isFeed)),
    undoRepostCollection: (id: ID) =>
      dispatch(undoRepostCollection(id, RepostSource.TILE)),
    saveCollection: (id: ID, isFeed: boolean) =>
      dispatch(saveCollection(id, FavoriteSource.TILE, isFeed)),
    unsaveCollection: (id: ID) =>
      dispatch(unsaveCollection(id, FavoriteSource.TILE))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedPlaylistTile))
