import {
  memo,
  useState,
  useCallback,
  useEffect,
  MouseEvent,
  useRef
} from 'react'

import {
  UID,
  ID,
  ShareSource,
  RepostSource,
  FavoriteSource,
  accountSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  tracksSocialActions,
  shareModalUIActions,
  playerSelectors,
  usePremiumContentAccess,
  premiumContentActions,
  Genre
} from '@audius/common'
import cn from 'classnames'
import { connect, useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import IconKebabHorizontal from 'assets/img/iconKebabHorizontal.svg'
import { useModalState } from 'common/hooks/useModalState'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { Draggable } from 'components/dragndrop'
import { Link } from 'components/link'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackArtwork } from 'components/track/Artwork'
import UserBadges from 'components/user-badges/UserBadges'
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
import { fullTrackPage, profilePage } from 'utils/route'
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
const { setLockedContentId } = premiumContentActions

type OwnProps = {
  uid: UID
  index: number
  order: number
  containerClassName?: string
  size: TrackTileSize
  showArtistPick: boolean
  ordered: boolean
  togglePlay: (uid: UID, id: ID) => void
  isLoading: boolean
  hasLoaded: (index: number) => void
  isTrending: boolean
  showRankIcon: boolean
  isFeed: boolean
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
  showRankIcon
}: ConnectedTrackTileProps) => {
  const trackWithFallback = getTrackWithFallback(track)
  const {
    is_delete,
    is_unlisted: isUnlisted,
    is_premium: isPremium,
    premium_conditions: premiumConditions,
    track_id: trackId,
    title,
    genre,
    permalink,
    repost_count,
    save_count,
    field_visibility: fieldVisibility,
    followee_reposts,
    followee_saves,
    _co_sign: coSign,
    has_current_user_reposted: isReposted,
    has_current_user_saved: isFavorited,
    _cover_art_sizes,
    play_count,
    duration,
    release_date: releaseDate
  } = trackWithFallback

  const {
    artist_pick_track_id,
    name,
    handle,
    is_deactivated: isOwnerDeactivated
  } = getUserWithFallback(user)

  const isActive = uid === playingUid
  const isTrackBuffering = isActive && isBuffering
  const isTrackPlaying = isActive && isPlaying
  const isOwner = handle === userHandle
  const isArtistPick = showArtistPick && artist_pick_track_id === trackId
  const hasPreview = !!track?.preview_cid

  const { isUserAccessTBD, doesUserHaveAccess } =
    usePremiumContentAccess(trackWithFallback)
  const loading = isLoading || isUserAccessTBD

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

  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !loading && hasLoaded) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, loading])

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
      callback: () => setArtworkLoaded(true),
      label: `${title} by ${name}`,
      doesUserHaveAccess: doesUserHaveAccess || hasPreview
    }
    return <TrackArtwork {...artworkProps} />
  }

  const renderOverflowMenu = () => {
    const menu: Omit<TrackMenuProps, 'children'> = {
      extraMenuItems: [],
      handle,
      includeAddToPlaylist: !isPremium,
      includeArtistPick: handle === userHandle && !isUnlisted,
      includeEdit: handle === userHandle,
      includeEmbed: !isPremium,
      includeFavorite: false,
      includeRepost: false,
      includeShare: false,
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

  const renderUserName = () => {
    return (
      <ArtistPopover handle={handle}>
        <Link to={profilePage(handle)} className={styles.name}>
          {name}

          <UserBadges
            userId={user?.user_id ?? 0}
            badgeSize={14}
            className={styles.badgeWrapper}
          />
        </Link>
      </ArtistPopover>
    )
  }

  const renderStats = () => {
    const contentTitle = 'track' // undefined,  playlist or album -  undefined is track
    const statSize = 'large'
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
        />
        <Stats
          count={save_count}
          followeeActions={followee_saves}
          contentTitle={contentTitle}
          size={statSize}
          onClick={onClickStatFavorite}
          flavor={Flavor.FAVORITE}
        />
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
      if (trackId && !doesUserHaveAccess && !hasPreview) {
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
      doesUserHaveAccess,
      openLockedContentModal
    ]
  )

  if (is_delete || user?.is_deactivated) return null

  const order = ordered && index !== undefined ? index + 1 : undefined
  const artwork = renderImage()
  const stats = renderStats()
  const rightActions = renderOverflowMenu()
  const userName = renderUserName()

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
      isPremium={isPremium}
      premiumConditions={premiumConditions}
      doesUserHaveAccess={doesUserHaveAccess}
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
      isTrending={isTrending}
      showRankIcon={showRankIcon}
      permalink={permalink}
      trackId={trackId}
      isTrack
      releaseDate={releaseDate}
    />
  )

  if (isPremium) {
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
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(memo(ConnectedTrackTile))
