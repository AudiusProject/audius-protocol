import { MouseEvent, useCallback, useRef, useState } from 'react'

import {
  CreatePlaylistSource,
  FavoriteSource,
  Name,
  SquareSizes,
  PlaylistLibrary as PlaylistLibraryType,
  Status,
  accountSelectors,
  cacheCollectionsActions,
  collectionsSocialActions,
  tracksSocialActions,
  createPlaylistModalUISelectors,
  createPlaylistModalUIActions as createPlaylistModalActions,
  imageProfilePicEmpty,
  playlistLibraryActions,
  playlistLibraryHelpers,
  CreateAccountOpen,
  playlistUpdatesActions
} from '@audius/common'
import { Scrollbar } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom'
import useMeasure from 'react-use-measure'
import { Dispatch } from 'redux'

import { make, useRecord } from 'common/store/analytics/actions'
import * as signOnActions from 'common/store/pages/signon/actions'
import CreatePlaylistModal from 'components/create-playlist/CreatePlaylistModal'
import { PlaylistFormFields } from 'components/create-playlist/PlaylistForm'
import { DragAutoscroller } from 'components/drag-autoscroller/DragAutoscroller'
import { Droppable } from 'components/dragndrop'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Pill from 'components/pill/Pill'
import ConnectedProfileCompletionPane from 'components/profile-progress/ConnectedProfileCompletionPane'
import Tooltip from 'components/tooltip/Tooltip'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { selectDragnDropState } from 'store/dragndrop/slice'
import { AppState } from 'store/types'
import {
  DASHBOARD_PAGE,
  EXPLORE_PAGE,
  FEED_PAGE,
  HISTORY_PAGE,
  playlistPage,
  profilePage,
  SAVED_PAGE,
  TRENDING_PAGE
} from 'utils/route'
import { getTempPlaylistId } from 'utils/tempPlaylistId'

import styles from './LeftNav.module.css'
import NavAudio from './NavAudio'
import { NavButton } from './NavButton'
import { NavHeader } from './NavHeader'
import { NowPlayingArtworkTile } from './NowPlayingArtworkTile'
import PlaylistLibrary from './PlaylistLibrary'
import { RouteNav } from './RouteNav'

const { updatedPlaylistViewed } = playlistUpdatesActions
const { update: updatePlaylistLibrary } = playlistLibraryActions
const { addFolderToLibrary, constructPlaylistFolder } = playlistLibraryHelpers
const { getHideFolderTab, getIsOpen } = createPlaylistModalUISelectors
const { saveTrack } = tracksSocialActions
const { saveCollection } = collectionsSocialActions
const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const { getAccountStatus, getAccountUser, getPlaylistLibrary } =
  accountSelectors

const messages = {
  newPlaylistOrFolderTooltip: 'New Playlist or Folder'
}

type OwnProps = {
  isElectron: boolean
}

type NavColumnProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const LeftNav = ({
  account,
  showActionRequiresAccount,
  createPlaylist,
  library,
  openCreatePlaylistModal,
  closeCreatePlaylistModal,
  isElectron,
  showCreatePlaylistModal,
  hideCreatePlaylistModalFolderTab,
  updatePlaylistLibrary,
  dragging: { dragging, kind, isOwner: draggingIsOwner },
  saveTrack,
  saveCollection,
  accountStatus,
  updatePlaylistLastViewedAt,
  goToRoute,
  goToSignUp: routeToSignup,
  goToSignIn
}: NavColumnProps) => {
  const record = useRecord()
  const [navBodyContainerMeasureRef, navBodyContainerBoundaries] = useMeasure({
    polyfill: ResizeObserver
  })
  const scrollbarRef = useRef<HTMLElement | null>(null)
  const [dragScrollingDirection, setDragScrollingDirection] = useState<
    'up' | 'down' | undefined
  >(undefined)
  const handleChangeDragScrollingDirection = useCallback(
    (newDirection: 'up' | 'down' | undefined) => {
      setDragScrollingDirection(newDirection)
    },
    []
  )

  const goToSignUp = useCallback(
    (source: CreateAccountOpen['source']) => {
      routeToSignup()
      record(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    },
    [record, routeToSignup]
  )

  const onClickNavProfile = useCallback(() => goToSignIn(), [goToSignIn])

  const goToProfile = useCallback(() => {
    if (account?.handle) {
      goToRoute(profilePage(account.handle))
    }
  }, [account, goToRoute])

  const onCreatePlaylist = useCallback(
    (metadata: PlaylistFormFields) => {
      const tempId = getTempPlaylistId()
      createPlaylist(tempId, metadata)
      closeCreatePlaylistModal()
      if (account) {
        goToRoute(playlistPage(account.handle, metadata.playlist_name, tempId))
      }
    },
    [account, createPlaylist, closeCreatePlaylistModal, goToRoute]
  )

  const onCreateFolder = useCallback(
    (folderName: string) => {
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
    (e?: MouseEvent, id?: number) => {
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

  const updateScrollTopPosition = useCallback((difference: number) => {
    if (scrollbarRef != null && scrollbarRef.current !== null) {
      scrollbarRef.current.scrollTop =
        scrollbarRef.current.scrollTop + difference
    }
  }, [])

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

  const navLoaded =
    accountStatus === Status.SUCCESS || accountStatus === Status.ERROR

  return (
    <nav id='leftNav' className={styles.leftNav}>
      {isElectron ? <RouteNav /> : null}
      <NavHeader />
      <div
        ref={navBodyContainerMeasureRef}
        className={cn(styles.leftNavContent, {
          [styles.show]: navLoaded,
          [styles.dragScrollingUp]: dragScrollingDirection === 'up',
          [styles.dragScrollingDown]: dragScrollingDirection === 'down'
        })}
      >
        <Scrollbar
          containerRef={(el: HTMLElement) => {
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
                      <div className={styles.nameText}>{name}</div>
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
                        text={messages.newPlaylistOrFolderTooltip}
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
        <NavButton />
        <NowPlayingArtworkTile />
      </div>
    </nav>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    account: getAccountUser(state),
    accountStatus: getAccountStatus(state),
    dragging: selectDragnDropState(state),
    library: getPlaylistLibrary(state),
    showCreatePlaylistModal: getIsOpen(state),
    hideCreatePlaylistModalFolderTab: getHideFolderTab(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createPlaylist: (tempId: number, metadata: Record<string, unknown>) =>
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
  openCreatePlaylistModal: () => dispatch(createPlaylistModalActions.open()),
  closeCreatePlaylistModal: () => dispatch(createPlaylistModalActions.close()),
  updatePlaylistLastViewedAt: (playlistId: number) =>
    dispatch(updatedPlaylistViewed({ playlistId })),
  updatePlaylistLibrary: (newLibrary: PlaylistLibraryType) =>
    dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary })),
  goToDashboard: () => dispatch(pushRoute(DASHBOARD_PAGE)),
  goToSignUp: () => dispatch(signOnActions.openSignOn(/** signIn */ false)),
  goToSignIn: () => dispatch(signOnActions.openSignOn(/** signIn */ true))
})

const ConnectedLeftNav = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(LeftNav)
)

export default ConnectedLeftNav
