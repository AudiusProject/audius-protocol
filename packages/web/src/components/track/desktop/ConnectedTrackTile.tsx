import { memo, useCallback, useEffect, MouseEvent, useRef } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  ID,
  UID
} from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  shareModalUIActions,
  playerSelectors,
  gatedContentActions
} from '@audius/common/store'
import { Genre } from '@audius/common/utils'
import { IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useModalState } from 'common/hooks/useModalState'
import { Draggable } from 'components/dragndrop'
import { UserLink } from 'components/link'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackArtwork } from 'components/track/Artwork'
import { AppState } from 'store/types'
import { isDescendantElementOf } from 'utils/domUtils'
import { fullTrackPage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getTrackWithFallback, getUserWithFallback } from '../helpers'
import { TrackTileSize } from '../types'

import styles from './ConnectedTrackTile.module.css'
import TrackTile from './TrackTile'
const { getUid, getPlaying, getBuffering } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getTrack } = cacheTracksSelectors
const { getUserFromTrack } = cacheUsersSelectors
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack } =
  tracksSocialActions
const { getUserHandle } = accountSelectors
const { setLockedContentId } = gatedContentActions

type OwnProps = {
  uid: UID
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

type ConnectedTrackTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedTrackTile = ({
  uid,
  index,
  size,
  track,
  user,
  ordered,
  togglePlay,
  isBuffering,
  isPlaying,
  playingUid,
  isLoading,
  hasLoaded,
  containerClassName,
  userHandle,
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack,
  shareTrack,
  isTrending,
  isFeed = false,
  onClick
}: ConnectedTrackTileProps) => {
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

  const {
    user_id,
    name,
    handle,
    is_deactivated: isOwnerDeactivated,
    artist_pick_track_id
  } = getUserWithFallback(user)

  const isActive = uid === playingUid
  const isTrackBuffering = isActive && isBuffering
  const isTrackPlaying = isActive && isPlaying
  const isOwner = handle === userHandle
  const hasPreview = !!track?.preview_cid
  const isArtistPick = artist_pick_track_id === trackId

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess

  const dispatch = useDispatch()
  const [, setLockedContentVisibility] = useModalState('LockedContent')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && hasLoaded) {
      hasLoaded(index)
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
      includeArtistPick: handle === userHandle,
      includeEdit: handle === userHandle,
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
      unsaveTrack(trackId)
    } else {
      saveTrack(trackId, isFeed)
    }
  }, [isFavorited, unsaveTrack, trackId, saveTrack, isFeed])

  const onClickRepost = useCallback(() => {
    if (isReposted) {
      undoRepostTrack(trackId)
    } else {
      repostTrack(trackId, isFeed)
    }
  }, [repostTrack, undoRepostTrack, trackId, isReposted, isFeed])

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

  if (is_delete || user?.is_deactivated) return null

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

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    track: getTrack(state, { uid: ownProps.uid }),
    user: getUserFromTrack(state, { uid: ownProps.uid }),
    playingUid: getUid(state),
    isBuffering: getBuffering(state),
    isPlaying: getPlaying(state),
    userHandle: getUserHandle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    shareTrack: (trackId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.TILE
        })
      ),
    repostTrack: (trackId: ID, isFeed: boolean) =>
      dispatch(repostTrack(trackId, RepostSource.TILE, isFeed)),
    undoRepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.TILE)),
    saveTrack: (trackId: ID, isFeed: boolean) =>
      dispatch(saveTrack(trackId, FavoriteSource.TILE, isFeed)),
    unsaveTrack: (trackId: ID) =>
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackTile))
