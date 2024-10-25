import { memo, useCallback, useEffect, MouseEvent, useRef } from 'react'

import { useFeatureFlag, useGatedContentAccess } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  ID,
  UID,
  Name
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
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
import { push } from 'connected-react-router'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { useModalState } from 'common/hooks/useModalState'
import { Draggable } from 'components/dragndrop'
import { UserLink } from 'components/link'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackArtwork } from 'components/track/Artwork'
import { make, track as trackEvent } from 'services/analytics'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { isDescendantElementOf } from 'utils/domUtils'
import { fullTrackPage } from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getTrackWithFallback, getUserWithFallback } from '../helpers'
import { TrackTileSize } from '../types'

import styles from './ConnectedTrackTile.module.css'
import TrackTile from './TrackTile'
import Stats from './stats/Stats'
import { Flavor } from './stats/StatsText'
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
  showArtistPick: boolean
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  showRankIcon: boolean
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
  showArtistPick,
  togglePlay,
  isBuffering,
  isPlaying,
  playingUid,
  isLoading,
  hasLoaded,
  containerClassName,
  setRepostUsers,
  setFavoriteUsers,
  setModalVisibility,
  userHandle,
  saveTrack,
  unsaveTrack,
  repostTrack,
  undoRepostTrack,
  shareTrack,
  isTrending,
  isFeed = false,
  showRankIcon,
  onClick,
  statSize = 'large',
  goToRoute
}: ConnectedTrackTileProps) => {
  const trackWithFallback = getTrackWithFallback(track)
  const {
    is_delete,
    is_unlisted: isUnlisted,
    is_scheduled_release: isScheduledRelease,
    is_stream_gated: isStreamGated,
    stream_conditions: streamConditions,
    track_id: trackId,
    title,
    genre,
    permalink,
    repost_count,
    save_count,
    comment_count,
    comments_disabled,
    field_visibility: fieldVisibility,
    followee_reposts,
    followee_saves,
    _co_sign: coSign,
    has_current_user_reposted: isReposted,
    has_current_user_saved: isFavorited,
    _cover_art_sizes,
    play_count,
    duration,
    release_date: releaseDate,
    ddex_app: ddexApp
  } = trackWithFallback

  const {
    user_id,
    artist_pick_track_id,
    name,
    handle,
    is_deactivated: isOwnerDeactivated
  } = getUserWithFallback(user)

  const { isEnabled: isCommentsEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isActive = uid === playingUid
  const isTrackBuffering = isActive && isBuffering
  const isTrackPlaying = isActive && isPlaying
  const isOwner = handle === userHandle
  const isArtistPick = showArtistPick && artist_pick_track_id === trackId
  const hasPreview = !!track?.preview_cid

  const { isFetchingNFTAccess, hasStreamAccess } =
    useGatedContentAccess(trackWithFallback)
  const loading = isLoading || isFetchingNFTAccess

  const dispatch = useDispatch()
  const [, setLockedContentVisibility] = useModalState('LockedContent')
  const menuRef = useRef<HTMLDivElement>(null)

  const onClickStatRepost = () => {
    setRepostUsers(trackId)
    setModalVisibility()
  }

  const onClickStatFavorite = () => {
    setFavoriteUsers(trackId)
    setModalVisibility()
  }

  const onClickStatComment = () => {
    goToRoute(permalink + '?showComments=true')

    trackEvent(
      make({
        eventName: Name.COMMENTS_CLICK_COMMENT_STAT,
        trackId,
        source: 'lineup'
      })
    )
  }

  useEffect(() => {
    if (!loading && hasLoaded) {
      hasLoaded(index)
    }
  }, [hasLoaded, index, loading])

  const renderImage = () => {
    const artworkProps = {
      id: trackId,
      coverArtSizes: _cover_art_sizes,
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

  const renderStats = () => {
    const contentTitle = 'track' // undefined,  playlist or album -  undefined is track
    return (
      <div className={cn(styles.socialInfo)}>
        <Stats
          hideImage={size === TrackTileSize.SMALL}
          count={repost_count}
          followeeActions={followee_reposts}
          contentTitle={contentTitle}
          size={statSize}
          onClick={onClickStatRepost}
          flavor={Flavor.REPOST}
          isOwner={isOwner}
        />
        <Stats
          count={save_count}
          followeeActions={followee_saves}
          contentTitle={contentTitle}
          size={statSize}
          onClick={onClickStatFavorite}
          flavor={Flavor.FAVORITE}
          isOwner={isOwner}
        />
        {!isCommentsEnabled || comments_disabled ? null : (
          <Stats
            count={comment_count}
            contentTitle={contentTitle}
            size={statSize}
            onClick={onClickStatComment}
            flavor={Flavor.COMMENT}
            isOwner={isOwner}
          />
        )}
      </div>
    )
  }

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
  const stats = renderStats()
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
      isUnlisted={isUnlisted}
      isScheduledRelease={isScheduledRelease}
      isStreamGated={isStreamGated}
      streamConditions={streamConditions}
      hasStreamAccess={hasStreamAccess}
      isLoading={loading}
      isDarkMode={isDarkMode()}
      isMatrixMode={isMatrix()}
      listenCount={play_count}
      isActive={isActive}
      isArtistPick={isArtistPick}
      isPlaying={isTrackPlaying}
      artwork={artwork}
      rightActions={rightActions}
      title={title}
      genre={genre as Genre}
      userName={userName}
      duration={duration}
      stats={stats}
      fieldVisibility={fieldVisibility}
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
      showRankIcon={showRankIcon}
      permalink={permalink}
      trackId={trackId}
      isTrack
      releaseDate={releaseDate}
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
      dispatch(unsaveTrack(trackId, FavoriteSource.TILE)),

    setRepostUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.TRACK,
          id: trackID
        })
      ),
    setFavoriteUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.TRACK,
          id: trackID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRoute: (route: string) => dispatch(push(route))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackTile))
