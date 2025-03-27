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
  useCollection,
  useUser,
  useCollectionTracksWithUid,
  useCurrentUserId
} from '@audius/common/api'
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
import { useCurrentUser } from '@audius/common/src/api/tan-query/useCurrentUser'
import {
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
import { useSelector, useDispatch } from 'react-redux'

import { TrackEvent, make } from 'common/store/analytics/actions'
import { Draggable } from 'components/dragndrop'
import { UserLink } from 'components/link'
import { OwnProps as CollectionkMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import { CollectionArtwork } from 'components/track/Artwork'
import { TrackTileSize } from 'components/track/types'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'
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
const {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} = collectionsSocialActions
const { collectionPage } = route

type PlaylistTileProps = {
  uid: UID
  id: ID
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

const ConnectedPlaylistTile = ({
  uid,
  id: collectionId,
  ordered,
  index,
  size,
  containerClassName,
  togglePlay,
  playTrack,
  pauseTrack,
  playingTrackId,
  isLoading,
  numLoadingSkeletonRows,
  isUploading,
  hasLoaded,
  isTrending,
  isFeed = false,
  source
}: PlaylistTileProps) => {
  const dispatch = useDispatch()

  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) => ({
      playlist_contents: collection?.playlist_contents,
      trackIds: collection?.trackIds,
      playlist_owner_id: collection?.playlist_owner_id,
      is_album: collection?.is_album,
      playlist_name: collection?.playlist_name,
      playlist_id: collection?.playlist_id,
      is_private: collection?.is_private,
      has_current_user_reposted: collection?.has_current_user_reposted,
      has_current_user_saved: collection?.has_current_user_saved,
      track_count: collection?.track_count,
      permalink: collection?.permalink,
      is_stream_gated: collection?.is_stream_gated,
      stream_conditions: collection?.stream_conditions,
      access: collection?.access
    })
  })
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
    access,
    playlist_owner_id
  } = getCollectionWithFallback(partialCollection)

  const tracks = useCollectionTracksWithUid(partialCollection, uid)
  const { data: currentUserId } = useCurrentUserId()
  const { data: partialUser } = useUser(playlist_owner_id, {
    select: (user) => ({
      is_deactivated: user?.is_deactivated,
      handle: user?.handle,
      user_id: user?.user_id
    })
  })
  const {
    is_deactivated: isOwnerDeactivated,
    handle = '',
    user_id
  } = partialUser ?? {}

  const playingUid = useSelector(getUid)
  const isBuffering = useSelector(getBuffering)
  const isPlaying = useSelector(getPlaying)

  const goToRoute = useCallback(
    (route: string, state?: LocationState) => dispatch(pushRoute(route, state)),
    [dispatch]
  )

  const record = useCallback((event: TrackEvent) => dispatch(event), [dispatch])

  const shareCollection = useCallback(
    (id: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: id,
          source: ShareSource.TILE
        })
      ),
    [dispatch]
  )

  const handleRepostCollection = useCallback(
    (id: ID, isFeed: boolean) =>
      dispatch(repostCollection(id, RepostSource.TILE, isFeed)),
    [dispatch]
  )

  const handleUndoRepostCollection = useCallback(
    (id: ID) => dispatch(undoRepostCollection(id, RepostSource.TILE)),
    [dispatch]
  )

  const handleSaveCollection = useCallback(
    (id: ID, isFeed: boolean) =>
      dispatch(saveCollection(id, FavoriteSource.TILE, isFeed)),
    [dispatch]
  )

  const handleUnsaveCollection = useCallback(
    (id: ID) => dispatch(unsaveCollection(id, FavoriteSource.TILE)),
    [dispatch]
  )

  const isOwner = currentUserId === user_id

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
      handleUnsaveCollection(id)
    } else {
      handleSaveCollection(id, isFeed)
    }
  }, [handleSaveCollection, handleUnsaveCollection, id, isFavorited, isFeed])

  const onClickRepost = useCallback(() => {
    if (isReposted) {
      handleUndoRepostCollection(id)
    } else {
      handleRepostCollection(id, isFeed)
    }
  }, [
    handleRepostCollection,
    handleUndoRepostCollection,
    id,
    isReposted,
    isFeed
  ])

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
      !tracks?.length &&
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
    return tracks?.map((track, i) => (
      <Draggable
        key={`${track.title}+${i}`}
        text={track.title}
        kind='track'
        id={track.track_id}
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
      duration={
        tracks?.reduce(
          (duration: number, track: Track) => duration + track.duration,
          0
        ) ?? 0
      }
      containerClassName={cn(styles.container, {
        [containerClassName!]: !!containerClassName,
        [styles.loading]: isLoading,
        [styles.active]: isActive,
        [styles.small]: size === TrackTileSize.SMALL,
        [styles.large]: TrackTileSize.LARGE
      })}
      tileClassName={cn(styles.trackTile)}
      tracksContainerClassName={cn(styles.tracksContainer)}
      trackList={trackList ?? []}
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

export default memo(ConnectedPlaylistTile)
