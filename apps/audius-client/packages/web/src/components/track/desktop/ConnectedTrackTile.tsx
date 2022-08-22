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
  shareModalUIActions
} from '@audius/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Draggable from 'components/dragndrop/Draggable'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import { TrackArtwork } from 'components/track/desktop/Artwork'
import UserBadges from 'components/user-badges/UserBadges'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getUid, getPlaying, getBuffering } from 'store/player/selectors'
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
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getTrack } = cacheTracksSelectors
const { getUserFromTrack } = cacheUsersSelectors
const { saveTrack, unsaveTrack, repostTrack, undoRepostTrack } =
  tracksSocialActions
const getUserHandle = accountSelectors.getUserHandle

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
}

type ConnectedTrackTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedTrackTile = memo(
  ({
    uid,
    index,
    size,
    track,
    user,
    ordered,
    showArtistPick,
    goToRoute,
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
    showRankIcon
  }: ConnectedTrackTileProps) => {
    const {
      is_delete,
      is_unlisted: isUnlisted,
      track_id: trackId,
      title,
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
      duration
    } = getTrackWithFallback(track)

    const {
      _artist_pick,
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)

    const isActive = uid === playingUid
    const isTrackBuffering = isActive && isBuffering
    const isTrackPlaying = isActive && isPlaying
    const isOwner = handle === userHandle
    const isArtistPick = showArtistPick && _artist_pick === trackId

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
      if (artworkLoaded && !isLoading && hasLoaded) {
        hasLoaded(index)
      }
    }, [artworkLoaded, hasLoaded, index, isLoading])

    const renderImage = () => {
      const artworkProps = {
        id: trackId,
        coverArtSizes: _cover_art_sizes,
        coSign: coSign || undefined,
        size: 'large',
        isBuffering: isTrackBuffering,
        isPlaying: isTrackPlaying,
        artworkIconClassName: styles.artworkIcon,
        showArtworkIcon: !isLoading,
        showSkeleton: isLoading,
        callback: () => setArtworkLoaded(true)
      }
      return <TrackArtwork {...artworkProps} />
    }

    const renderOverflowMenu = () => {
      const menu: Omit<TrackMenuProps, 'children'> = {
        extraMenuItems: [],
        handle,
        includeAddToPlaylist: true,
        includeArtistPick: handle === userHandle && !isUnlisted,
        includeEdit: handle === userHandle,
        includeEmbed: true,
        includeFavorite: false,
        includeRepost: false,
        includeShare: false,
        includeTrackPage: true,
        isArtistPick,
        isDeleted: is_delete || isOwnerDeactivated,
        isFavorited,
        isOwner,
        isReposted,
        trackId,
        trackTitle: title,
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
                onClick={triggerPopup}
              >
                <IconKebabHorizontal
                  className={cn(styles.iconKebabHorizontal)}
                  ref={ref}
                />
              </div>
            </div>
          )}
        </Menu>
      )
    }

    const onClickArtistName = useCallback(
      (e) => {
        e.stopPropagation()
        if (goToRoute) goToRoute(profilePage(handle))
      },
      [handle, goToRoute]
    )

    const onClickTitle = useCallback(
      (e) => {
        e.stopPropagation()
        if (goToRoute) goToRoute(permalink)
      },
      [goToRoute, permalink]
    )

    const renderUserName = () => {
      return (
        <div className={styles.userName}>
          <ArtistPopover handle={handle}>
            <span
              className={cn(styles.name, {
                [styles.artistNameLink]: onClickArtistName
              })}
              onClick={onClickArtistName}
            >
              {name}
            </span>
          </ArtistPopover>
          <UserBadges
            userId={user?.user_id ?? 0}
            badgeSize={14}
            className={styles.badgeWrapper}
          />
        </div>
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
        saveTrack(trackId)
      }
    }, [saveTrack, unsaveTrack, trackId, isFavorited])

    const onClickRepost = useCallback(() => {
      if (isReposted) {
        undoRepostTrack(trackId)
      } else {
        repostTrack(trackId)
      }
    }, [repostTrack, undoRepostTrack, trackId, isReposted])

    const onClickShare = useCallback(() => {
      shareTrack(trackId)
    }, [shareTrack, trackId])

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
        togglePlay(uid, trackId)
      },
      [togglePlay, uid, trackId]
    )

    if (is_delete || user?.is_deactivated) return null

    const order = ordered && index !== undefined ? index + 1 : undefined
    const artwork = renderImage()
    const stats = renderStats()
    const rightActions = renderOverflowMenu()
    const userName = renderUserName()

    const disableActions = false
    const showSkeleton = isLoading

    return (
      <Draggable
        text={title}
        kind='track'
        id={trackId}
        isOwner={isOwner}
        isDisabled={disableActions || showSkeleton}
        link={fullTrackPage(permalink)}
      >
        <TrackTile
          size={size}
          order={order}
          standalone
          isFavorited={isFavorited}
          isReposted={isReposted}
          isOwner={isOwner}
          isUnlisted={isUnlisted}
          isLoading={isLoading}
          isDarkMode={isDarkMode()}
          isMatrixMode={isMatrix()}
          listenCount={play_count}
          isActive={isActive}
          isArtistPick={isArtistPick}
          artwork={artwork}
          rightActions={rightActions}
          title={title}
          userName={userName}
          duration={duration}
          stats={stats}
          fieldVisibility={fieldVisibility}
          containerClassName={cn(styles.container, {
            [containerClassName!]: !!containerClassName,
            [styles.loading]: isLoading,
            [styles.active]: isActive
          })}
          onClickTitle={onClickTitle}
          onClickRepost={onClickRepost}
          onClickFavorite={onClickFavorite}
          onClickShare={onClickShare}
          onTogglePlay={onTogglePlay}
          isTrending={isTrending}
          showRankIcon={showRankIcon}
        />
      </Draggable>
    )
  }
)

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
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareTrack: (trackId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.TILE
        })
      ),
    repostTrack: (trackId: ID) =>
      dispatch(repostTrack(trackId, RepostSource.TILE)),
    undoRepostTrack: (trackId: ID) =>
      dispatch(undoRepostTrack(trackId, RepostSource.TILE)),
    saveTrack: (trackId: ID) =>
      dispatch(saveTrack(trackId, FavoriteSource.TILE)),
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

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedTrackTile)
