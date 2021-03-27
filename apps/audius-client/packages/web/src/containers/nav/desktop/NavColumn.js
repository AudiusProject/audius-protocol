import React, { useCallback } from 'react'
import { connect } from 'react-redux'
import { withRouter, NavLink } from 'react-router-dom'
import { push as pushRoute } from 'connected-react-router'
import cn from 'classnames'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import { Status } from 'store/types'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  UPLOAD_PAGE,
  trackPage,
  fullTrackPage,
  profilePage,
  playlistPage,
  getPathname,
  EXPLORE_PAGE
} from 'utils/route'

import { toggleNotificationPanel } from 'containers/notification/store/actions'
import {
  getNotificationPanelIsOpen,
  getNotificationUnreadCount
} from 'containers/notification/store/selectors'
import { resetState as resetUploadState } from 'containers/upload-page/store/actions'
import {
  createPlaylist,
  addTrackToPlaylist
} from 'store/cache/collections/actions'
import { makeGetCurrent } from 'store/queue/selectors'
import { getIsDragging } from 'store/dragndrop/selectors'
import { getIsOpen } from 'store/application/ui/createPlaylistModal/selectors'
import {
  getAccountUser,
  getAccountStatus,
  getAccountPlaylists
} from 'store/account/selectors'
import * as signOnActions from 'containers/sign-on/store/actions'
import * as createPlaylistModalActions from 'store/application/ui/createPlaylistModal/actions'
import { saveTrack } from 'store/social/tracks/actions'
import { saveCollection } from 'store/social/collections/actions'

import Tooltip from 'components/tooltip/Tooltip'
import Pill from 'components/general/Pill'
import NavButton from 'containers/nav/desktop/NavButton'
import CurrentlyPlaying from 'containers/nav/desktop/CurrentlyPlaying'
import CreatePlaylistModal from 'components/create-playlist/CreatePlaylistModal'
import Droppable from 'containers/dragndrop/Droppable'
import RouteNav from 'containers/nav/desktop/RouteNav'
import ConnectedProfileCompletionPane from 'containers/profile-progress/ConnectedProfileCompletionPane'
import DynamicImage from 'components/dynamic-image/DynamicImage'

import { useUserProfilePicture } from 'hooks/useImageSize'
import { SquareSizes } from 'models/common/ImageSizes'

import imageProfilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'

import styles from './NavColumn.module.css'
import NavHeader from './NavHeader'
import { make, useRecord } from 'store/analytics/actions'
import { Name, CreatePlaylistSource } from 'services/analytics'
import { Variant } from 'models/Collection'
import { getAverageColorByTrack } from 'store/application/ui/average-color/slice'
import UserBadges from 'containers/user-badges/UserBadges'

const NavColumn = ({
  account,
  metadata,
  showActionRequiresAccount,
  createPlaylist,
  openCreatePlaylistModal,
  closeCreatePlaylistModal,
  isElectron,
  notificationCount,
  notificationPanelIsOpen,
  toggleNotificationPanel,
  showCreatePlaylistModal,
  currentQueueItem,
  dragging: { dragging, kind, isOwner: draggingIsOwner },
  saveTrack,
  saveCollection,
  addTrackToPlaylist,
  upload,
  accountStatus,
  playlists = [],
  resetUploadState,
  goToRoute,
  goToSignUp: routeToSignup,
  goToUpload,
  averageRGBColor
}) => {
  const record = useRecord()
  const goToSignUp = useCallback(
    source => {
      routeToSignup()
      record(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    },
    [record, routeToSignup]
  )

  const onClickNavProfile = useCallback(() => goToSignUp('nav profile'), [
    goToSignUp
  ])
  const onClickNavButton = useCallback(() => goToSignUp('nav button'), [
    goToSignUp
  ])

  const goToProfile = useCallback(() => {
    if (account.handle) goToRoute(profilePage(account.handle))
  }, [account, goToRoute])

  const onClickToggleNotificationPanel = useCallback(() => {
    toggleNotificationPanel()
    if (!notificationPanelIsOpen)
      record(make(Name.NOTIFICATIONS_OPEN, { source: 'button' }))
  }, [notificationPanelIsOpen, toggleNotificationPanel, record])

  const onCreatePlaylist = useCallback(
    metadata => {
      const tempId = `${Date.now()}`
      createPlaylist(tempId, metadata)
      closeCreatePlaylistModal()
      goToRoute(playlistPage(account.handle, metadata.playlist_name, tempId))
    },
    [account, createPlaylist, closeCreatePlaylistModal, goToRoute]
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
    e => {
      if (!account) {
        e.preventDefault()
        goToSignUp('restricted page')
        showActionRequiresAccount()
      }
    },
    [account, goToSignUp, showActionRequiresAccount]
  )

  /** @param {bool} full whether or not to get the full page link */
  const getTrackPageLink = useCallback(
    (full = false) => {
      if (currentQueueItem && currentQueueItem.user && currentQueueItem.track) {
        return full
          ? fullTrackPage(
              currentQueueItem.user.handle,
              currentQueueItem.track.title,
              currentQueueItem.track.track_id
            )
          : trackPage(
              currentQueueItem.user.handle,
              currentQueueItem.track.title,
              currentQueueItem.track.track_id
            )
      }
      return null
    },
    [currentQueueItem]
  )

  const onClickArtwork = useCallback(() => {
    const route = getTrackPageLink()
    if (route) goToRoute(route)
  }, [goToRoute, getTrackPageLink])

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
      <div className={cn(styles.navContent, { [styles.show]: navLoaded })}>
        <SimpleBar className={styles.scrollable}>
          {account ? (
            <div className={styles.accountWrapper}>
              <DynamicImage
                wrapperClassName={styles.warpperPhoto}
                className={styles.dynamicPhoto}
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
          ) : (
            <div className={styles.accountWrapper}>
              <div
                className={styles.photo}
                style={{ backgroundImage: `url(${imageProfilePicEmpty})` }}
                onClick={onClickNavProfile}
              />
              <div className={styles.userInfoWrapper}>
                <div className={styles.haveAccount}>Want to Join?</div>
                <div className={styles.logIn} onClick={onClickNavProfile}>
                  Sign Up
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
                className={cn(styles.link, { [styles.disabledLink]: dragging })}
              >
                Trending
              </NavLink>
              <NavLink
                to={EXPLORE_PAGE}
                exact
                activeClassName='active'
                className={cn(styles.link, { [styles.disabledLink]: dragging })}
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
                    <Tooltip text='New Playlist' mount='parent'>
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
                {account &&
                  playlists.map(playlist => {
                    if (playlist.variant === Variant.SMART) {
                      const name = playlist.playlist_name
                      const url = playlist.link
                      return (
                        <NavLink
                          key={name}
                          to={url}
                          isActive={() => url === getPathname()}
                          activeClassName='active'
                          onClick={onClickNavLinkWithAccount}
                          className={cn(styles.link, {
                            [styles.disabledLink]: !account || dragging
                          })}
                        >
                          {name}
                        </NavLink>
                      )
                    }

                    const id = playlist.id
                    const name = playlist.name
                    const url = playlistPage(playlist.user.handle, name, id)
                    const addTrack = trackId => addTrackToPlaylist(trackId, id)
                    const isOwner = playlist.user.handle === account.handle
                    return (
                      <Droppable
                        key={id}
                        className={styles.droppable}
                        hoverClassName={styles.droppableHover}
                        onDrop={addTrack}
                        acceptedKinds={['track']}
                        disabled={!isOwner}
                      >
                        <NavLink
                          key={id}
                          to={url}
                          isActive={() => url === getPathname()}
                          activeClassName='active'
                          className={cn(styles.link, {
                            [styles.droppableLink]:
                              isOwner &&
                              dragging &&
                              (kind === 'track' || kind === 'playlist'),
                            [styles.disabledLink]:
                              dragging &&
                              ((kind !== 'track' && kind !== 'playlist') ||
                                !isOwner)
                          })}
                          onClick={onClickNavLinkWithAccount}
                        >
                          {name}
                        </NavLink>
                      </Droppable>
                    )
                  })}
                {playlists.length === 0 ? (
                  <div className={cn(styles.link, styles.disabled)}>
                    Create your first playlist!
                  </div>
                ) : null}
              </Droppable>
            </div>
          </div>
        </SimpleBar>
        <CreatePlaylistModal
          visible={showCreatePlaylistModal}
          onSave={onCreatePlaylist}
          onCancel={closeCreatePlaylistModal}
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
          isOwner={
            // Note: if neither are defined, it should eval to false, so setting default to different values
            (currentQueueItem?.user?.handle ?? null) ===
            (account?.handle ?? undefined)
          }
          coverArtColor={averageRGBColor}
          coverArtSizes={currentQueueItem.track?._cover_art_sizes ?? null}
          draggableLink={getTrackPageLink()}
          onClick={onClickArtwork}
        />
      </div>
    </nav>
  )
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = state => {
    const currentQueueItem = getCurrentQueueItem(state)
    return {
      currentQueueItem,
      account: getAccountUser(state),
      accountStatus: getAccountStatus(state),
      playlists: getAccountPlaylists(state),
      dragging: getIsDragging(state),
      notificationCount: getNotificationUnreadCount(state),
      notificationPanelIsOpen: getNotificationPanelIsOpen(state),
      upload: state.upload,
      showCreatePlaylistModal: getIsOpen(state),
      averageRGBColor: getAverageColorByTrack(state, {
        track: currentQueueItem.track
      })
    }
  }
  return mapStateToProps
}

const mapDispatchToProps = dispatch => ({
  resetUploadState: () => dispatch(resetUploadState()),
  createPlaylist: (tempId, metadata) =>
    dispatch(createPlaylist(tempId, metadata, CreatePlaylistSource.NAV)),
  goToRoute: route => dispatch(pushRoute(route)),
  saveTrack: trackId => dispatch(saveTrack(trackId)),
  saveCollection: collectionId => dispatch(saveCollection(collectionId)),
  addTrackToPlaylist: (trackId, playlistId) =>
    dispatch(addTrackToPlaylist(trackId, playlistId)),
  showActionRequiresAccount: () =>
    dispatch(signOnActions.showRequiresAccountModal()),
  toggleNotificationPanel: () => dispatch(toggleNotificationPanel()),
  openCreatePlaylistModal: () => dispatch(createPlaylistModalActions.open()),
  closeCreatePlaylistModal: () => dispatch(createPlaylistModalActions.close()),
  goToUpload: () => dispatch(pushRoute(UPLOAD_PAGE)),
  goToDashboard: () => dispatch(pushRoute(DASHBOARD_PAGE)),
  goToSignUp: () => dispatch(signOnActions.openSignOn(/** signIn */ false)),
  goToSignIn: () => dispatch(signOnActions.openSignOn(/** signIn */ true))
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(NavColumn)
)
