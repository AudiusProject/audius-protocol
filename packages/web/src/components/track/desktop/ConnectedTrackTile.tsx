import { memo, useCallback, useEffect, MouseEvent, useRef } from 'react'

import { useCurrentUserId, useTrack, useUser } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  ID,
  UID
} from '@audius/common/models'
import {
  tracksSocialActions,
  shareModalUIActions,
  playerSelectors,
  gatedContentActions
} from '@audius/common/store'
import { Genre } from '@audius/common/utils'
import { IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Draggable } from 'components/dragndrop'
import { UserLink } from 'components/link'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackArtwork } from 'components/track/Artwork'
import { isDescendantElementOf } from 'utils/domUtils'
import { fullTrackPage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getTrackWithFallback, getUserWithFallback } from '../helpers'
import { TrackTileSize } from '../types'

import styles from './ConnectedTrackTile.module.css'
import TrackTile from './TrackTile'

const { getUid, getPlaying, getBuffering } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { repostTrack, undoRepostTrack, saveTrack, unsaveTrack } =
  tracksSocialActions
const { setLockedContentId } = gatedContentActions

type OwnProps = {
  uid: UID
  id: ID
  index: number
  order: number
  containerClassName?: string
  size: TrackTileSize
  statSize: 'small' | 'large'
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  isFeed: boolean
  onClick?: (trackId: ID) => void
}

type ConnectedTrackTileProps = OwnProps

const ConnectedTrackTile = ({
  uid,
  id,
  index,
  size,
  ordered,
  togglePlay,
  isLoading,
  hasLoaded,
  containerClassName,
  isTrending,
  isFeed = false,
  onClick
}: ConnectedTrackTileProps) => {
  const dispatch = useDispatch()
  const { data: currentUserId } = useCurrentUserId()
  const { data: track, isPending } = useTrack(id)
  const { data: partialUser } = useUser(track?.owner_id, {
    select: (user) => ({
      user_id: user?.user_id,
      handle: user?.handle,
      name: user?.name,
      is_verified: user?.is_verified,
      is_deactivated: user?.is_deactivated,
      artist_pick_track_id: user?.artist_pick_track_id
    })
  })
  const {
    user_id,
    name,
    handle,
    is_deactivated: isOwnerDeactivated,
    artist_pick_track_id
  } = getUserWithFallback(partialUser)
  const playingUid = useSelector(getUid)
  const isBuffering = useSelector(getBuffering)
  const isPlaying = useSelector(getPlaying)

  const shareTrack = useCallback(
    (trackId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.TILE
        })
      )
    },
    [dispatch]
  )
  const handleSaveTrack = useCallback(
    (trackId: ID, isFeed: boolean) => {
      dispatch(saveTrack(trackId, FavoriteSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUndoSaveTrack = useCallback(
    (trackId: ID) => {
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE))
    },
    [dispatch]
  )

  const handleRepostTrack = useCallback(
    (trackId: ID, isFeed: boolean) => {
      dispatch(repostTrack(trackId, RepostSource.TILE, isFeed))
    },
    [dispatch]
  )

  const handleUndoRepostTrack = useCallback(
    (trackId: ID) => {
      dispatch(undoRepostTrack(trackId, RepostSource.TILE))
    },
    [dispatch]
  )

  const trackWithFallback = getTrackWithFallback(track)
  const {
    is_delete,
    is_unlisted: isUnlisted,
    is_stream_gated: isStreamGated,
    stream_conditions: streamConditions,
    track_id: trackId,
    title,
    genre,
    permalink,
    _co_sign: coSign,
    has_current_user_reposted: isReposted,
    has_current_user_saved: isFavorited,
    duration,
    ddex_app: ddexApp
  } = trackWithFallback

  const isActive = uid === playingUid
  const isTrackBuffering = isActive && isBuffering
  const isTrackPlaying = isActive && isPlaying
  const isOwner = currentUserId === user_id
  const hasPreview = !!track?.preview_cid
  const isArtistPick = artist_pick_track_id === trackId

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess || isPending

  const [, setLockedContentVisibility] = useModalState('LockedContent')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && hasLoaded) {
      hasLoaded?.(index)
    }
  }, [hasLoaded, index, loading])

  const renderImage = () => {
    const artworkProps = {
      id: trackId,
      coSign: coSign || undefined,
      size: 'large',
      isBuffering: isTrackBuffering,
      isPlaying: isTrackPlaying,
      artworkIconClassName: styles.artworkIcon,
      showArtworkIcon: !loading,
      showSkeleton: loading,
      label: `${title} by ${name}`,
      hasStreamAccess: hasStreamAccess || hasPreview
    }
    return <TrackArtwork {...artworkProps} />
  }

  const renderOverflowMenu = () => {
    const menu: Omit<TrackMenuProps, 'children'> = {
      extraMenuItems: [],
      handle,
      includeAddToPlaylist: !isUnlisted || isOwner,
      includeAddToAlbum: isOwner && !ddexApp,
      includeArtistPick: isOwner,
      includeEdit: isOwner,
      ddexApp: track?.ddex_app,
      includeEmbed: !(isUnlisted || isStreamGated),
      includeFavorite: hasStreamAccess,
      includeRepost: hasStreamAccess,
      includeShare: true,
      includeTrackPage: true,
      isArtistPick,
      isDeleted: is_delete || isOwnerDeactivated,
      isFavorited,
      isOwner,
      isReposted,
      isUnlisted,
      trackId,
      trackTitle: title,
      genre: genre as Genre,
      trackPermalink: permalink,
      type: 'track'
    }

    return (
      <Menu menu={menu}>
        {(ref, triggerPopup) => (
          <div className={styles.menuContainer} ref={menuRef}>
            <div
              className={cn(styles.menuKebabContainer, {
                [styles.small]: size === TrackTileSize.SMALL,
                [styles.large]: size === TrackTileSize.LARGE
              })}
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
    <UserLink userId={user_id} badgeSize='xs' isActive={isActive} popover />
  )

  const onClickFavorite = useCallback(() => {
    if (isFavorited) {
      handleUndoSaveTrack(trackId)
    } else {
      handleSaveTrack(trackId, isFeed)
    }
  }, [isFavorited, handleUndoSaveTrack, trackId, handleSaveTrack, isFeed])

  const onClickRepost = useCallback(() => {
    if (isReposted) {
      handleUndoRepostTrack(trackId)
    } else {
      handleRepostTrack(trackId, isFeed)
    }
  }, [handleRepostTrack, handleUndoRepostTrack, trackId, isReposted, isFeed])

  const onClickShare = useCallback(() => {
    shareTrack(trackId)
  }, [shareTrack, trackId])

  const onClickTitle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onClick?.(trackId)
    },
    [onClick, trackId]
  )

  const openLockedContentModal = useCallback(() => {
    dispatch(setLockedContentId({ id: trackId }))
    setLockedContentVisibility(true)
  }, [dispatch, trackId, setLockedContentVisibility])

  const onTogglePlay = useCallback(
    (e?: MouseEvent /* click event within TrackTile */) => {
      // Skip toggle play if click event happened within track menu container
      // because clicking on it should not affect corresponding track.
      // We have to do this instead of stopping the event propagation
      // because we need it to bubble up to the document to allow
      // the document click listener to close other track/playlist tile menus
      // that are already open.
      const shouldSkipTogglePlay = isDescendantElementOf(
        e?.target,
        menuRef.current
      )
      if (shouldSkipTogglePlay) return

      // Show the locked content modal if gated track and user does not have access.
      // Also skip toggle play in this case.
      if (trackId && !hasStreamAccess && !hasPreview) {
        openLockedContentModal()
        return
      }

      togglePlay(uid, trackId)
    },
    [
      togglePlay,
      hasPreview,
      uid,
      trackId,
      hasStreamAccess,
      openLockedContentModal
    ]
  )

  if (is_delete || isOwnerDeactivated) return null

  const order = ordered && index !== undefined ? index + 1 : undefined
  const artwork = renderImage()
  const rightActions = renderOverflowMenu()

  const disableActions = false
  const showSkeleton = loading

  const tileContent = (
    <TrackTile
      size={size}
      order={order}
      standalone
      isFavorited={isFavorited}
      isReposted={isReposted}
      isOwner={isOwner}
      streamConditions={streamConditions}
      hasStreamAccess={hasStreamAccess}
      isLoading={loading}
      isDarkMode={isDarkMode()}
      isMatrixMode={isMatrix()}
      isActive={isActive}
      isPlaying={isTrackPlaying}
      artwork={artwork}
      rightActions={rightActions}
      title={title}
      genre={genre as Genre}
      userName={userName}
      duration={duration}
      containerClassName={cn(styles.container, {
        [containerClassName!]: !!containerClassName,
        [styles.loading]: loading,
        [styles.active]: isActive
      })}
      onClickRepost={onClickRepost}
      onClickFavorite={onClickFavorite}
      onClickShare={onClickShare}
      onClickLocked={openLockedContentModal}
      onTogglePlay={onTogglePlay}
      onClickTitle={onClickTitle}
      isTrending={isTrending}
      permalink={permalink}
      trackId={trackId}
      isTrack
    />
  )

  if (isStreamGated) {
    return tileContent
  }

  return (
    <Draggable
      text={title}
      kind='track'
      id={trackId}
      isOwner={isOwner}
      isDisabled={disableActions || showSkeleton}
      link={fullTrackPage(permalink)}
    >
      {tileContent}
    </Draggable>
  )
}

export default memo(ConnectedTrackTile)
