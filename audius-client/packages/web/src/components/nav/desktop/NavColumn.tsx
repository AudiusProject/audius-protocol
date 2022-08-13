import { MouseEvent, useCallback, useRef, useState } from 'react'

import {
  CreatePlaylistSource,
  FavoriteSource,
  Name,
  SquareSizes,
  PlaylistLibrary as PlaylistLibraryType,
  Status,
  FeatureFlags
} from '@audius/common'
import { Scrollbar } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import {
  NavLink,
  RouteComponentProps,
  useHistory,
  withRouter
} from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import imageProfilePicEmpty from 'common/assets/img/imageProfilePicEmpty2X.png'
import {
  getAccountStatus,
  getAccountUser,
  getPlaylistLibrary
} from 'common/store/account/selectors'
import { getDominantColorsByTrack } from 'common/store/average-color/slice'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'common/store/cache/collections/actions'
import {
  toggleNotificationPanel,
  updatePlaylistLastViewedAt
} from 'common/store/notifications/actions'
import {
  getNotificationPanelIsOpen,
  getNotificationUnviewedCount
} from 'common/store/notifications/selectors'
import {
  addFolderToLibrary,
  constructPlaylistFolder
} from 'common/store/playlist-library/helpers'
import { makeGetCurrent } from 'common/store/queue/selectors'
import { saveCollection } from 'common/store/social/collections/actions'
import { saveTrack } from 'common/store/social/tracks/actions'
import * as createPlaylistModalActions from 'common/store/ui/createPlaylistModal/actions'
import {
  getHideFolderTab,
  getIsOpen
} from 'common/store/ui/createPlaylistModal/selectors'
import CreatePlaylistModal from 'components/create-playlist/CreatePlaylistModal'
import { DragAutoscroller } from 'components/drag-autoscroller/DragAutoscroller'
import Droppable from 'components/dragndrop/Droppable'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import CurrentlyPlaying from 'components/nav/desktop/CurrentlyPlaying'
import NavButton from 'components/nav/desktop/NavButton'
import RouteNav from 'components/nav/desktop/RouteNav'
import Pill from 'components/pill/Pill'
import ConnectedProfileCompletionPane from 'components/profile-progress/ConnectedProfileCompletionPane'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges/UserBadges'
import { useFlag } from 'hooks/useRemoteConfig'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import * as signOnActions from 'pages/sign-on/store/actions'
import { resetState as resetUploadState } from 'pages/upload-page/store/actions'
import { NO_VISUALIZER_ROUTES } from 'pages/visualizer/Visualizer'
import { openVisualizer } from 'pages/visualizer/store/slice'
import { make, useRecord } from 'store/analytics/actions'
import { getIsDragging } from 'store/dragndrop/selectors'
import { makeGetCurrent as makeGetCurrentPlayer } from 'store/player/selectors'
import { update as updatePlaylistLibrary } from 'store/playlist-library/slice'
import { AppState } from 'store/types'
import {
  DASHBOARD_PAGE,
  EXPLORE_PAGE,
  FEED_PAGE,
  fullTrackPage,
  HISTORY_PAGE,
  playlistPage,
  profilePage,
  SAVED_PAGE,
  TRENDING_PAGE,
  UPLOAD_PAGE
} from 'utils/route'

import NavAudio from './NavAudio'
import styles from './NavColumn.module.css'
import NavHeader from './NavHeader'
import PlaylistLibrary from './PlaylistLibrary'

const messages = {
  newPlaylistOrFolderTooltip: 'New Playlist or Folder',
  newPlaylistTooltip: 'New Playlist'
}

type OwnProps = {
  isElectron: boolean
}

type NavColumnProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const NavColumn = ({
  account,
  showActionRequiresAccount,
  createPlaylist,
  library,
  openCreatePlaylistModal,
  closeCreatePlaylistModal,
  isElectron,
  notificationCount,
  notificationPanelIsOpen,
  toggleNotificationPanel,
  showCreatePlaylistModal,
  hideCreatePlaylistModalFolderTab,
  updatePlaylistLibrary,
  currentQueueItem,
  currentPlayerItem,
  dragging: { dragging, kind, isOwner: draggingIsOwner },
  saveTrack,
  saveCollection,
  upload,
  accountStatus,
  updatePlaylistLastViewedAt,
  resetUploadState,
  goToRoute,
  goToSignUp: routeToSignup,
  goToSignIn,
  goToUpload,
  showVisualizer,
  dominantColors
}: NavColumnProps) => {
  const record = useRecord()
  const { location } = useHistory()
  const { pathname } = location
  const [navBodyContainerMeasureRef, navBodyContainerBoundaries] = useMeasure({
    polyfill: ResizeObserver
  })
  const scrollbarRef = useRef<HTMLElement | null>(null)
  const [dragScrollingDirection, setDragScrollingDirection] =
    useState(undefined)
  const handleChangeDragScrollingDirection = useCallback((newDirection) => {
    setDragScrollingDirection(newDirection)
  }, [])

  const goToSignUp = useCallback(
    (source) => {
      routeToSignup()
      record(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    },
    [record, routeToSignup]
  )
  const { isEnabled: isPlaylistFoldersEnabled } = useFlag(
    FeatureFlags.PLAYLIST_FOLDERS
  )

  const onClickNavProfile = useCallback(() => goToSignIn(), [goToSignIn])
  const onClickNavButton = useCallback(
    () => goToSignUp('nav button'),
    [goToSignUp]
  )

  const goToProfile = useCallback(() => {
    if (account?.handle) {
      goToRoute(profilePage(account.handle))
    }
  }, [account, goToRoute])

  const onClickToggleNotificationPanel = useCallback(() => {
    toggleNotificationPanel()
    if (!notificationPanelIsOpen)
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
  }, [notificationPanelIsOpen, toggleNotificationPanel, record])

  const onCreatePlaylist = useCallback(
    (metadata) => {
      const tempId = `${Date.now()}`
      createPlaylist(tempId, metadata)
      closeCreatePlaylistModal()
      if (account) {
        goToRoute(playlistPage(account.handle, metadata.playlist_name, tempId))
      }
    },
    [account, createPlaylist, closeCreatePlaylistModal, goToRoute]
  )

  const onCreateFolder = useCallback(
    (folderName) => {
      const newLibrary = addFolderToLibrary(
        library,
        constructPlaylistFolder(folderName)
      )
      updatePlaylistLibrary(newLibrary)
      closeCreatePlaylistModal()
    },
    [library, updatePlaylistLibrary, closeCreatePlaylistModal]
  )

  const openCreatePlaylist = useCallback(() => {
    if (account) {
      openCreatePlaylistModal()
      record(
        make(Name.PLAYLIST_OPEN_CREATE, { source: CreatePlaylistSource.NAV })
      )
    } else {
      goToSignUp('social action')
      showActionRequiresAccount()
    }
  }, [
    account,
    openCreatePlaylistModal,
    goToSignUp,
    showActionRequiresAccount,
    record
  ])

  const onClickNavLinkWithAccount = useCallback(
    (e?: MouseEvent<HTMLAnchorElement>, id?: number) => {
      if (!account) {
        e?.preventDefault()
        goToSignUp('restricted page')
        showActionRequiresAccount()
      } else if (id) {
        updatePlaylistLastViewedAt(id)
      }
    },
    [account, goToSignUp, showActionRequiresAccount, updatePlaylistLastViewedAt]
  )

  const updateScrollTopPosition = useCallback((difference) => {
    if (scrollbarRef != null && scrollbarRef.current !== null) {
      scrollbarRef.current.scrollTop =
        scrollbarRef.current.scrollTop + difference
    }
  }, [])

  /** @param {bool} full whether or not to get the full page link */
  const getTrackPageLink = useCallback(
    (full = false) => {
      if (currentQueueItem && currentQueueItem.user && currentQueueItem.track) {
        return full
          ? fullTrackPage(currentQueueItem.track.permalink)
          : currentQueueItem.track.permalink
      }
      return null
    },
    [currentQueueItem]
  )

  const onClickArtwork = useCallback(() => {
    const route = getTrackPageLink()
    if (route) goToRoute(route)
  }, [goToRoute, getTrackPageLink])

  const onShowVisualizer = useCallback(
    (e) => {
      if (NO_VISUALIZER_ROUTES.has(pathname)) return
      showVisualizer()
      e.stopPropagation()
    },
    [showVisualizer, pathname]
  )

  const onClickUpload = useCallback(() => {
    if (!upload.uploading) resetUploadState()
    goToUpload()
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'nav' }))
  }, [goToUpload, upload, resetUploadState, record])

  const profileCompletionMeter = (
    <div className={styles.profileCompletionContainer}>
      <ConnectedProfileCompletionPane />
    </div>
  )

  let name, handle
  if (account) {
    name = account.name
    handle = account.handle
  }

  const profileImage = useUserProfilePicture(
    account ? account.user_id : null,
    account ? account._profile_picture_sizes : null,
    SquareSizes.SIZE_150_BY_150
  )

  let navButtonStatus = 'signedOut'
  if (account) navButtonStatus = 'signedIn'
  if (upload.uploading) navButtonStatus = 'uploading'
  if (accountStatus === Status.LOADING) navButtonStatus = 'loading'

  const navLoaded =
    accountStatus === Status.SUCCESS || accountStatus === Status.ERROR

  return (
    <nav id='navColumn' className={styles.navColumn}>
      {isElectron && <RouteNav />}
      <NavHeader
        account={account}
        notificationCount={notificationCount}
        notificationPanelIsOpen={notificationPanelIsOpen}
        toggleNotificationPanel={onClickToggleNotificationPanel}
        goToRoute={goToRoute}
        isElectron={isElectron}
      />
      <div
        ref={navBodyContainerMeasureRef}
        className={cn(styles.navContent, {
          [styles.show]: navLoaded,
          [styles.dragScrollingUp]: dragScrollingDirection === 'up',
          [styles.dragScrollingDown]: dragScrollingDirection === 'down'
        })}
      >
        <Scrollbar
          containerRef={(el) => {
            scrollbarRef.current = el
          }}
          className={styles.scrollable}
        >
          <DragAutoscroller
            containerBoundaries={navBodyContainerBoundaries}
            updateScrollTopPosition={updateScrollTopPosition}
            onChangeDragScrollingDirection={handleChangeDragScrollingDirection}
          >
            {account ? (
              <div className={styles.userHeader}>
                <div className={styles.accountWrapper}>
                  <DynamicImage
                    wrapperClassName={styles.wrapperPhoto}
                    className={styles.dynamicPhoto}
                    skeletonClassName={styles.wrapperPhotoSkeleton}
                    onClick={goToProfile}
                    image={profileImage}
                  />
                  <div className={styles.userInfoWrapper}>
                    <div className={styles.name} onClick={goToProfile}>
                      {name}
                      <UserBadges
                        userId={account.user_id}
                        badgeSize={12}
                        className={styles.badge}
                      />
                    </div>
                    <div className={styles.handleContainer}>
                      <span
                        className={styles.handle}
                        onClick={goToProfile}
                      >{`@${handle}`}</span>
                    </div>
                  </div>
                </div>
                <NavAudio />
              </div>
            ) : (
              <div className={styles.userHeader}>
                <div className={styles.accountWrapper}>
                  <div
                    className={styles.photo}
                    style={{ backgroundImage: `url(${imageProfilePicEmpty})` }}
                    onClick={onClickNavProfile}
                  />
                  <div className={styles.userInfoWrapper}>
                    <div className={styles.haveAccount}>Have an Account?</div>
                    <div className={styles.logIn} onClick={onClickNavProfile}>
                      Sign In
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.links}>
              <div className={styles.linkGroup}>
                <div className={styles.groupHeader}>Discover</div>
                <NavLink
                  to={FEED_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: !account || dragging
                  })}
                  onClick={onClickNavLinkWithAccount}
                >
                  Feed
                </NavLink>
                <NavLink
                  to={TRENDING_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: dragging
                  })}
                >
                  Trending
                </NavLink>
                <NavLink
                  to={EXPLORE_PAGE}
                  exact
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: dragging
                  })}
                >
                  Explore
                </NavLink>
              </div>
              <div className={styles.linkGroup}>
                <div className={styles.groupHeader}>Library</div>
                <Droppable
                  className={styles.droppable}
                  hoverClassName={styles.droppableHover}
                  acceptedKinds={['track', 'album']}
                  acceptOwner={false}
                  onDrop={kind === 'album' ? saveCollection : saveTrack}
                >
                  <NavLink
                    to={SAVED_PAGE}
                    activeClassName='active'
                    className={cn(styles.link, {
                      [styles.disabledLink]:
                        !account ||
                        (dragging && kind === 'playlist') ||
                        draggingIsOwner,
                      [styles.droppableLink]:
                        dragging &&
                        !draggingIsOwner &&
                        (kind === 'track' || kind === 'album')
                    })}
                    onClick={onClickNavLinkWithAccount}
                  >
                    Favorites
                  </NavLink>
                </Droppable>
                <NavLink
                  to={HISTORY_PAGE}
                  activeClassName='active'
                  className={cn(styles.link, {
                    [styles.disabledLink]: !account || dragging
                  })}
                  onClick={onClickNavLinkWithAccount}
                >
                  History
                </NavLink>
              </div>
              <div className={styles.linkGroup}>
                <Droppable
                  className={styles.droppableGroup}
                  hoverClassName={styles.droppableGroupHover}
                  onDrop={saveCollection}
                  acceptedKinds={['playlist']}
                >
                  <div
                    className={cn(styles.groupHeader, {
                      [styles.droppableLink]: dragging && kind === 'playlist'
                    })}
                  >
                    Playlists
                    <div className={styles.newPlaylist}>
                      <Tooltip
                        text={
                          isPlaylistFoldersEnabled
                            ? messages.newPlaylistOrFolderTooltip
                            : messages.newPlaylistTooltip
                        }
                        getPopupContainer={() =>
                          scrollbarRef.current?.parentNode
                        }
                      >
                        <span>
                          <Pill
                            text='New'
                            icon='save'
                            onClick={openCreatePlaylist}
                          />
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                  <PlaylistLibrary
                    onClickNavLinkWithAccount={onClickNavLinkWithAccount}
                  />
                </Droppable>
              </div>
            </div>
          </DragAutoscroller>
        </Scrollbar>
        <CreatePlaylistModal
          visible={showCreatePlaylistModal}
          onCreatePlaylist={onCreatePlaylist}
          onCreateFolder={onCreateFolder}
          onCancel={closeCreatePlaylistModal}
          hideFolderTab={hideCreatePlaylistModalFolderTab}
        />
      </div>
      <div className={styles.navAnchor}>
        {profileCompletionMeter}
        <NavButton
          status={navButtonStatus}
          onCreateAccount={onClickNavButton}
          onUpload={onClickUpload}
        />
        <CurrentlyPlaying
          trackId={currentQueueItem.track?.track_id ?? null}
          trackTitle={currentQueueItem.track?.title ?? null}
          isUnlisted={currentQueueItem.track?.is_unlisted ?? false}
          isOwner={
            // Note: if neither are defined, it should eval to false, so setting default to different values
            (currentQueueItem?.user?.handle ?? null) ===
            (account?.handle ?? undefined)
          }
          coverArtColor={dominantColors ? dominantColors[0] : null}
          coverArtSizes={currentQueueItem.track?._cover_art_sizes ?? null}
          artworkLink={
            currentPlayerItem.collectible?.imageUrl ||
            currentPlayerItem.collectible?.frameUrl ||
            currentPlayerItem.collectible?.gifUrl
          }
          draggableLink={getTrackPageLink()}
          onClick={onClickArtwork}
          onShowVisualizer={onShowVisualizer}
        />
      </div>
    </nav>
  )
}

const getCurrentQueueItem = makeGetCurrent()
const getCurrentPlayerItem = makeGetCurrentPlayer()

const mapStateToProps = (state: AppState) => {
  const currentQueueItem = getCurrentQueueItem(state)
  const currentPlayerItem = getCurrentPlayerItem(state)
  return {
    currentQueueItem,
    currentPlayerItem,
    account: getAccountUser(state),
    accountStatus: getAccountStatus(state),
    dragging: getIsDragging(state),
    notificationCount: getNotificationUnviewedCount(state),
    notificationPanelIsOpen: getNotificationPanelIsOpen(state),
    upload: state.upload,
    library: getPlaylistLibrary(state),
    showCreatePlaylistModal: getIsOpen(state),
    hideCreatePlaylistModalFolderTab: getHideFolderTab(state),
    dominantColors: getDominantColorsByTrack(state, {
      track: currentQueueItem.track
    })
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  resetUploadState: () => dispatch(resetUploadState()),
  createPlaylist: (tempId: string, metadata: Record<string, unknown>) =>
    dispatch(createPlaylist(tempId, metadata, CreatePlaylistSource.NAV)),
  goToRoute: (route: string) => dispatch(pushRoute(route)),
  saveTrack: (trackId: number) =>
    dispatch(saveTrack(trackId, FavoriteSource.NAVIGATOR)),
  saveCollection: (collectionId: number) =>
    dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR)),
  addTrackToPlaylist: (trackId: number, playlistId: number) =>
    dispatch(addTrackToPlaylist(trackId, playlistId)),
  showActionRequiresAccount: () =>
    dispatch(signOnActions.showRequiresAccountModal()),
  toggleNotificationPanel: () => dispatch(toggleNotificationPanel()),
  openCreatePlaylistModal: () => dispatch(createPlaylistModalActions.open()),
  closeCreatePlaylistModal: () => dispatch(createPlaylistModalActions.close()),
  updatePlaylistLastViewedAt: (playlistId: number) =>
    dispatch(updatePlaylistLastViewedAt(playlistId)),
  updatePlaylistLibrary: (newLibrary: PlaylistLibraryType) =>
    dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary })),
  goToUpload: () => dispatch(pushRoute(UPLOAD_PAGE)),
  goToDashboard: () => dispatch(pushRoute(DASHBOARD_PAGE)),
  goToSignUp: () => dispatch(signOnActions.openSignOn(/** signIn */ false)),
  goToSignIn: () => dispatch(signOnActions.openSignOn(/** signIn */ true)),
  showVisualizer: () => dispatch(openVisualizer())
})

const ConnectedNavColumn = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(NavColumn)
)

export default ConnectedNavColumn
