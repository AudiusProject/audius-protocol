import {
  MouseEvent,
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  ReactChildren
} from 'react'

import {
  UID,
  ID,
  ShareSource,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  Name,
  Track
} from '@audius/common'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { range } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { getUserHandle } from 'common/store/account/selectors'
import {
  getCollection,
  getTracksFromCollection
} from 'common/store/cache/collections/selectors'
import { getUserFromCollection } from 'common/store/cache/users/selectors'
import {
  saveCollection,
  unsaveCollection,
  repostCollection,
  undoRepostCollection
} from 'common/store/social/collections/actions'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Draggable from 'components/dragndrop/Draggable'
import { OwnProps as CollectionkMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import { CollectionArtwork } from 'components/track/desktop/Artwork'
import { TrackTileSize } from 'components/track/types'
import UserBadges from 'components/user-badges/UserBadges'
import { TrackEvent, make } from 'store/analytics/actions'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getUid, getBuffering, getPlaying } from 'store/player/selectors'
import { AppState } from 'store/types'
import {
  albumPage,
  fullAlbumPage,
  fullPlaylistPage,
  fullTrackPage,
  playlistPage,
  profilePage
} from 'utils/route'
import { isDarkMode, isMatrix } from 'utils/theme/theme'

import { getCollectionWithFallback, getUserWithFallback } from '../helpers'

import styles from './ConnectedPlaylistTile.module.css'
import PlaylistTile from './PlaylistTile'
import TrackListItem from './TrackListItem'
import Stats from './stats/Stats'
import { Flavor } from './stats/StatsText'

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
  showRankIcon: boolean
}

type ConnectedPlaylistTileProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedPlaylistTile = memo(
  ({
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
    setRepostUsers,
    setFavoriteUsers,
    setModalVisibility,
    shareCollection,
    repostCollection,
    undoRepostCollection,
    saveCollection,
    unsaveCollection,
    isTrending,
    showRankIcon
  }: ConnectedPlaylistTileProps) => {
    const {
      is_album: isAlbum,
      playlist_name: title,
      playlist_id: id,
      is_private: isPrivate,
      _cover_art_sizes: coverArtSizes,
      repost_count: repostCount,
      save_count: saveCount,
      followee_reposts: followeeReposts,
      followee_saves: followeeSaves,
      has_current_user_reposted: isReposted,
      has_current_user_saved: isFavorited,
      track_count: trackCount
    } = getCollectionWithFallback(collection)

    const {
      name,
      handle,
      is_deactivated: isOwnerDeactivated
    } = getUserWithFallback(user)
    const isOwner = handle === userHandle

    const isActive = useMemo(() => {
      return tracks.some((track: any) => track.uid === playingUid)
    }, [tracks, playingUid])

    const onTogglePlay = useCallback(() => {
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
    }, [
      isPlaying,
      tracks,
      playTrack,
      pauseTrack,
      isActive,
      playingUid,
      playingTrackId,
      isUploading,
      record
    ])

    const onClickTitle = useCallback(
      (e: MouseEvent) => {
        e.stopPropagation()
        goToRoute(
          isAlbum
            ? albumPage(handle, title, id)
            : playlistPage(handle, title, id)
        )
      },
      [goToRoute, isAlbum, handle, title, id]
    )

    const [artworkLoaded, setArtworkLoaded] = useState(false)
    useEffect(() => {
      if (artworkLoaded && !isLoading && hasLoaded) {
        hasLoaded(index)
      }
    }, [artworkLoaded, hasLoaded, index, isLoading])

    const renderImage = useCallback(() => {
      const artworkProps = {
        id,
        coverArtSizes,
        size: 'large',
        isBuffering: isBuffering && isActive,
        isPlaying: isPlaying && isActive,
        artworkIconClassName: styles.artworkIcon,
        showArtworkIcon: !isLoading,
        showSkeleton: isLoading,
        callback: () => setArtworkLoaded(true)
      }
      return <CollectionArtwork {...artworkProps} />
    }, [
      id,
      coverArtSizes,
      isActive,
      isBuffering,
      isPlaying,
      isLoading,
      setArtworkLoaded
    ])

    const renderOverflowMenu = () => {
      const menu: Omit<CollectionkMenuProps, 'children'> = {
        handle,
        isFavorited,
        isReposted,
        type: isAlbum ? 'album' : 'playlist', // playlist or album
        playlistId: id,
        playlistName: title,
        isPublic: !isPrivate,
        isOwner,
        includeEmbed: true,
        includeShare: false,
        includeRepost: false,
        includeFavorite: false,
        includeVisitPage: true,
        extraMenuItems: []
      }

      return (
        <Menu menu={menu}>
          {(ref, triggerPopup) => (
            <div className={styles.menuContainer}>
              <div className={styles.menuKebabContainer} onClick={triggerPopup}>
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

    const renderUserName = () => {
      return (
        <div className={styles.userName}>
          <span className={styles.createdBy}>{'Created by'}</span>
          <ArtistPopover handle={handle}>
            <span
              className={cn(styles.name, {
                [styles.artistNameLink]: onClickArtistName
              })}
              onClick={onClickArtistName}>
              {name}
            </span>
          </ArtistPopover>
          <UserBadges
            userId={user?.user_id ?? 0}
            className={styles.iconVerified}
            badgeSize={14}
          />
        </div>
      )
    }

    const onClickStatFavorite = useCallback(() => {
      setFavoriteUsers(id!)
      setModalVisibility()
    }, [setFavoriteUsers, id, setModalVisibility])

    const onClickStatRepost = useCallback(() => {
      setRepostUsers(id!)
      setModalVisibility()
    }, [setRepostUsers, id, setModalVisibility])

    const renderStats = () => {
      const contentTitle = 'track' // undefined,  playlist or album -  undefined is track
      const sz = 'large'
      return (
        <div className={cn(styles.socialInfo)}>
          <Stats
            hideImage={size === TrackTileSize.SMALL}
            count={repostCount}
            followeeActions={followeeReposts}
            contentTitle={contentTitle}
            size={sz}
            onClick={onClickStatRepost}
            flavor={Flavor.REPOST}
          />
          <Stats
            count={saveCount}
            followeeActions={followeeSaves}
            contentTitle={contentTitle}
            size={sz}
            onClick={onClickStatFavorite}
            flavor={Flavor.FAVORITE}
          />
        </div>
      )
    }

    const onClickFavorite = useCallback(() => {
      if (isFavorited) {
        unsaveCollection(id)
      } else {
        saveCollection(id)
      }
    }, [saveCollection, unsaveCollection, id, isFavorited])

    const onClickRepost = useCallback(() => {
      if (isReposted) {
        undoRepostCollection(id)
      } else {
        repostCollection(id)
      }
    }, [repostCollection, undoRepostCollection, id, isReposted])

    const onClickShare = useCallback(() => {
      shareCollection(id)
    }, [shareCollection, id])

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
          link={
            isAlbum
              ? fullAlbumPage(handle, title, id)
              : fullPlaylistPage(handle, title, id)
          }>
          {children as any}
        </Draggable>
      ),
      [id, disableActions, title, isAlbum, handle, isOwner]
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
          link={fullTrackPage(track.permalink)}>
          <TrackListItem
            index={i}
            key={`${track.title}+${i}`}
            isLoading={isLoading}
            active={playingUid === track.uid}
            size={size}
            disableActions={disableActions}
            playing={isPlaying}
            track={track}
            togglePlay={togglePlay}
            goToRoute={goToRoute}
            artistHandle={handle}
          />
        </Draggable>
      ))
    }, [
      tracks,
      isLoading,
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
    const stats = renderStats()
    const rightActions = renderOverflowMenu()
    const userName = renderUserName()
    const trackList = renderTrackList()

    const order = ordered && index !== undefined ? index + 1 : undefined
    const header =
      size === TrackTileSize.LARGE
        ? isAlbum
          ? 'ALBUM'
          : 'PLAYLIST'
        : undefined

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
        artwork={artwork}
        rightActions={rightActions}
        title={title}
        userName={userName}
        stats={stats}
        header={header}
        onClickTitle={onClickTitle}
        onClickRepost={onClickRepost}
        onClickFavorite={onClickFavorite}
        onClickShare={onClickShare}
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
        showRankIcon={showRankIcon}
      />
    )
  }
)

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
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    record: (event: TrackEvent) => dispatch(event),
    shareCollection: (id: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId: id,
          source: ShareSource.TILE
        })
      ),
    repostCollection: (id: ID) =>
      dispatch(repostCollection(id, RepostSource.TILE)),
    undoRepostCollection: (id: ID) =>
      dispatch(undoRepostCollection(id, RepostSource.TILE)),
    saveCollection: (id: ID) =>
      dispatch(saveCollection(id, FavoriteSource.TILE)),
    unsaveCollection: (id: ID) =>
      dispatch(unsaveCollection(id, FavoriteSource.TILE)),

    setRepostUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: trackID
        })
      ),
    setFavoriteUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: trackID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedPlaylistTile)
