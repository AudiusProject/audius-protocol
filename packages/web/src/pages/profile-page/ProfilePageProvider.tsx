import { ComponentType, PureComponent, RefObject, useEffect } from 'react'

import { useUserByParams } from '@audius/common/api'
import {
  Name,
  ShareSource,
  FollowSource,
  CreatePlaylistSource,
  Status,
  ID,
  UserMetadata,
  PhotoUpdate,
  WriteableUserMetadata
} from '@audius/common/models'
import { newUserMetadata } from '@audius/common/schemas'
import {
  accountActions,
  accountSelectors,
  cacheCollectionsActions,
  profilePageActions as profileActions,
  profilePageSelectors,
  CollectionSortMode,
  TracksSortMode,
  ProfilePageTabs,
  getTabForRoute,
  chatActions,
  chatSelectors,
  ChatPermissionAction,
  queueSelectors,
  usersSocialActions as socialActions,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  inboxUnavailableModalActions,
  followingUserListActions,
  followersUserListActions,
  playerSelectors
} from '@audius/common/store'
import { getErrorMessage, route } from '@audius/common/utils'
import { UnregisterCallback } from 'history'
import moment from 'moment'
import { connect, useDispatch } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { make, TrackEvent } from 'common/store/analytics/actions'
import {
  openSignOn,
  showRequiresAccountToast
} from 'common/store/pages/signon/actions'
import { ProfileMode } from 'components/stat-banner/StatBanner'
import { StatProps } from 'components/stats/Stats'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import { verifiedHandleWhitelist } from 'utils/handleWhitelist'
import { resizeImage } from 'utils/imageProcessingUtil'
import { push, replace } from 'utils/navigation'
import { getPathname } from 'utils/route'
import { parseUserRoute } from 'utils/route/userRouteParser'

import { ProfilePageProps as DesktopProfilePageProps } from './components/desktop/ProfilePage'
import { ProfilePageProps as MobileProfilePageProps } from './components/mobile/ProfilePage'
const { NOT_FOUND_PAGE, profilePage } = route
const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open } = mobileOverflowMenuUIActions
const { fetchHasTracks } = accountActions
const { createPlaylist } = cacheCollectionsActions

const { makeGetProfile, getProfileFeedLineup, getProfileTracksLineup } =
  profilePageSelectors
const { getUserId, getAccountHasTracks } = accountSelectors
const { createChat, blockUser, unblockUser } = chatActions
const { getBlockees, getBlockers, getCanCreateChat } = chatSelectors

const INITIAL_UPDATE_FIELDS = {
  updatedName: null,
  updatedCoverPhoto: null,
  updatedProfilePicture: null,
  updatedBio: null,
  updatedLocation: null,
  updatedTwitterHandle: null,
  updatedInstagramHandle: null,
  updatedTikTokHandle: null,
  updatedWebsite: null,
  updatedDonation: null
}

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  children:
    | ComponentType<MobileProfilePageProps>
    | ComponentType<DesktopProfilePageProps>
  updateProfile: (args: WriteableUserMetadata) => void
}

type ProfilePageProviderProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const ProfilePageProvider = (props: ProfilePageProviderProps) => {
  const dispatch = useDispatch()
  const params = parseUserRoute(props.pathname)
  const { data: user } = useUserByParams(params!)

  const handle = user?.handle

  useEffect(() => {
    if (handle) {
      dispatch(profileActions.setCurrentUser(handle))
    }
  }, [handle, dispatch])

  return <ProfilePage {...props} user={user} />
}

type ProfilePageState = {
  activeTab: ProfilePageTabs | null
  editMode: boolean
  shouldMaskContent: boolean
  updatedName: string | null
  updatedCoverPhoto: PhotoUpdate | null
  updatedProfilePicture: PhotoUpdate | null
  updatedBio: string | null
  updatedLocation: string | null
  updatedTwitterHandle: string | null
  updatedInstagramHandle: string | null
  updatedTikTokHandle: string | null
  updatedWebsite: string | null
  updatedDonation: string | null
  tracksLineupOrder: TracksSortMode
  areArtistRecommendationsVisible: boolean
  showBlockUserConfirmationModal: boolean
  showUnblockUserConfirmationModal: boolean
  showMuteUserConfirmationModal: boolean
  showUnmuteUserConfirmationModal: boolean
}

type ProfilePageProps = ProfilePageProviderProps & {
  user: UserMetadata | null | undefined
}

class ProfilePage extends PureComponent<ProfilePageProps, ProfilePageState> {
  state: ProfilePageState = {
    activeTab: null,
    editMode: false,
    shouldMaskContent: false,
    tracksLineupOrder: TracksSortMode.RECENT,
    areArtistRecommendationsVisible: false,
    showBlockUserConfirmationModal: false,
    showUnblockUserConfirmationModal: false,
    showMuteUserConfirmationModal: false,
    showUnmuteUserConfirmationModal: false,
    ...INITIAL_UPDATE_FIELDS
  }

  unlisten!: UnregisterCallback

  componentDidMount() {
    const params = parseUserRoute(this.props.pathname)
    if (params?.tab) {
      this.setState({
        activeTab: getTabForRoute(params.tab)
      })
    }
    // Switching from profile page => profile page
    this.unlisten = this.props.history.listen((location, action) => {
      // If changing pages or "POP" on router (with goBack, the pathnames are equal)
      if (
        getPathname(this.props.location) !== getPathname(location) ||
        action === 'POP'
      ) {
        this.setState({
          activeTab: null,
          ...INITIAL_UPDATE_FIELDS
        })
      }
    })
  }

  componentWillUnmount() {
    if (this.unlisten) {
      // Push unlisten to end of event loop. On some browsers, the back button
      // will cause the component to unmount and remove the unlisten faster than
      // the history listener will run. See [AUD-403].
      setImmediate(this.unlisten)
    }
  }

  componentDidUpdate(prevProps: ProfilePageProps, prevState: ProfilePageState) {
    const {
      pathname,
      profile,
      artistTracks,
      goToRoute,
      accountUserId,
      accountHasTracks,
      user
    } = this.props
    const { editMode, activeTab } = this.state

    if (!this.getIsOwner(prevProps) && this.getIsOwner()) {
      this.props.fetchAccountHasTracks()
    }

    if (profile && profile.status === Status.ERROR) {
      goToRoute(NOT_FOUND_PAGE)
    }

    const isOwnProfile = accountUserId === user?.user_id
    const hasTracks =
      (user && user.track_count > 0) || (isOwnProfile && accountHasTracks)

    if (!isOwnProfile || accountHasTracks !== null) {
      if (
        !activeTab &&
        profile &&
        user &&
        artistTracks!.status === Status.SUCCESS
      ) {
        if (hasTracks) {
          this.setState({
            activeTab: ProfilePageTabs.TRACKS
          })
        } else {
          this.setState({
            activeTab: ProfilePageTabs.REPOSTS
          })
        }
      } else if (!activeTab && profile && user && !hasTracks) {
        this.setState({
          activeTab: ProfilePageTabs.REPOSTS
        })
      }
    }

    // Replace the URL with the properly formatted /handle route
    if (profile && user && profile.status === Status.SUCCESS) {
      const params = parseUserRoute(pathname)
      if (params) {
        const { handle } = params
        if (handle === null) {
          const newPath = profilePage(user.handle)
          this.props.replaceRoute(newPath)
        }
      }
    }

    if (prevProps.user?.handle !== user?.handle) {
      // If editing profile and route to another user profile, exit edit mode
      if (editMode) this.setState({ editMode: false })
      // Close artist recommendations when the profile changes
      this.setState({ areArtistRecommendationsVisible: false })
    }
  }

  onFollow = () => {
    const { user } = this.props
    if (!user) return
    this.props.onFollow(user.user_id)
    this.setState({ areArtistRecommendationsVisible: true })
  }

  onUnfollow = () => {
    const { user } = this.props
    if (!user) return
    const userId = user.user_id
    this.props.onUnfollow(userId)
  }

  onCloseArtistRecommendations = () => {
    this.setState({ areArtistRecommendationsVisible: false })
  }

  onCloseBlockUserConfirmationModal = () => {
    this.setState({ showBlockUserConfirmationModal: false })
  }

  onCloseUnblockUserConfirmationModal = () => {
    this.setState({ showUnblockUserConfirmationModal: false })
  }

  onCloseMuteUserConfirmationModal = () => {
    this.setState({ showMuteUserConfirmationModal: false })
  }

  onCloseUnmuteUserConfirmationModal = () => {
    this.setState({ showUnmuteUserConfirmationModal: false })
  }

  updateName = (name: string) => {
    this.setState({
      updatedName: name
    })
  }

  updateCoverPhoto = async (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file, 2000, /* square= */ false)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedCoverPhoto: { file, url, source }
      })
    } catch (error) {
      this.setState({
        updatedCoverPhoto: {
          ...(this.state.updatedCoverPhoto || {}),
          error: getErrorMessage(error)
        }
      })
    }
  }

  updateProfilePicture = async (
    selectedFiles: FileList,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedProfilePicture: { file, url, source }
      })
    } catch (error) {
      const { updatedProfilePicture } = this.state
      this.setState({
        updatedProfilePicture: {
          ...(updatedProfilePicture && updatedProfilePicture.url
            ? this.state.updatedProfilePicture
            : {}),
          error: getErrorMessage(error)
        }
      })
    }
  }

  updateBio = (bio: string) => {
    this.setState({
      updatedBio: bio
    })
  }

  updateLocation = (location: string) => {
    this.setState({
      updatedLocation: location
    })
  }

  updateTwitterHandle = (handle: string) => {
    this.setState({
      updatedTwitterHandle: handle
    })
  }

  updateInstagramHandle = (handle: string) => {
    this.setState({
      updatedInstagramHandle: handle
    })
  }

  updateTikTokHandle = (handle: string) => {
    this.setState({
      updatedTikTokHandle: handle
    })
  }

  updateWebsite = (website: string) => {
    this.setState({
      updatedWebsite: website
    })
  }

  updateDonation = (donation: string) => {
    this.setState({
      updatedDonation: donation
    })
  }

  changeTab = (tab: ProfilePageTabs) => {
    this.setState({
      activeTab: tab
    })

    // Once the hero card settles into place, then turn the mask off
    setTimeout(() => {
      const firstTab = this.getIsArtist() ? 'Tracks' : 'Reposts'
      this.setState({
        shouldMaskContent: tab !== firstTab
      })
    }, 300)
  }

  getLineupProps = (lineup: any) => {
    const { currentQueueItem, playing, buffering, containerRef } = this.props
    const { uid: playingUid, track, source } = currentQueueItem
    return {
      lineup,
      variant: 'condensed',
      playingSource: source,
      playingTrackId: track ? track.track_id : null,
      playingUid,
      playing,
      buffering,
      scrollParent: containerRef
    }
  }

  getMode = (isOwner: boolean): ProfileMode => {
    return isOwner ? (this.state.editMode ? 'editing' : 'owner') : 'visitor'
  }

  onEdit = () => {
    this.setState({
      editMode: true,
      updatedName: null,
      updatedCoverPhoto: null,
      updatedProfilePicture: null,
      updatedBio: null,
      updatedLocation: null,
      updatedTwitterHandle: null,
      updatedInstagramHandle: null,
      updatedTikTokHandle: null,
      updatedWebsite: null,
      updatedDonation: null
    })
  }

  onSave = () => {
    const { user, recordUpdateCoverPhoto, recordUpdateProfilePicture } =
      this.props
    const {
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedTikTokHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

    const updatedMetadata = newUserMetadata({ ...user })
    if (updatedCoverPhoto && updatedCoverPhoto.file) {
      updatedMetadata.updatedCoverPhoto = updatedCoverPhoto
      recordUpdateCoverPhoto(updatedCoverPhoto.source)
    }
    if (updatedProfilePicture && updatedProfilePicture.file) {
      updatedMetadata.updatedProfilePicture = updatedProfilePicture
      recordUpdateProfilePicture(updatedProfilePicture.source)
    }
    if (updatedName) {
      updatedMetadata.name = updatedName
    }
    if (updatedBio !== null) {
      updatedMetadata.bio = updatedBio
    }
    if (updatedLocation !== null) {
      updatedMetadata.location = updatedLocation
    }
    if (updatedTwitterHandle !== null) {
      updatedMetadata.twitter_handle = updatedTwitterHandle
    }
    if (updatedInstagramHandle !== null) {
      updatedMetadata.instagram_handle = updatedInstagramHandle
    }
    if (updatedTikTokHandle !== null) {
      updatedMetadata.tiktok_handle = updatedTikTokHandle
    }
    if (updatedWebsite !== null) {
      updatedMetadata.website = updatedWebsite
    }
    if (updatedDonation !== null) {
      updatedMetadata.donation = updatedDonation
    }
    this.props.updateProfile(updatedMetadata)
    this.setState({
      editMode: false
    })
  }

  onShare = () => {
    const { user } = this.props
    if (!user) return
    this.props.onShare(user.user_id)
  }

  onCancel = () => {
    this.setState({
      editMode: false,
      updatedName: null,
      updatedCoverPhoto: null,
      updatedProfilePicture: null,
      updatedBio: null,
      updatedLocation: null
    })
  }

  getStats = (isArtist: boolean): StatProps[] => {
    const { user } = this.props

    let trackCount = 0
    let playlistCount = 0
    let followerCount = 0
    let followingCount = 0

    if (user) {
      trackCount = user.track_count
      playlistCount = user.playlist_count
      followerCount = user.follower_count
      followingCount = user.followee_count
    }

    return isArtist
      ? [
          {
            number: trackCount,
            title: trackCount === 1 ? 'track' : 'tracks',
            key: 'track'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
      : [
          {
            number: playlistCount,
            title: playlistCount === 1 ? 'playlist' : 'playlists',
            key: 'playlist'
          },
          {
            number: followerCount,
            title: followerCount === 1 ? 'follower' : 'followers',
            key: 'follower'
          },
          { number: followingCount, title: 'following', key: 'following' }
        ]
  }

  onSortByRecent = () => {
    const { updateCollectionOrder, user, trackUpdateSort } = this.props
    if (!user) return
    this.setState({ tracksLineupOrder: TracksSortMode.RECENT })
    updateCollectionOrder(CollectionSortMode.TIMESTAMP)
    trackUpdateSort('recent')
  }

  onSortByPopular = () => {
    const { updateCollectionOrder, user, trackUpdateSort } = this.props
    if (!user) return
    this.setState({ tracksLineupOrder: TracksSortMode.POPULAR })
    updateCollectionOrder(CollectionSortMode.SAVE_COUNT)
    trackUpdateSort('popular')
  }

  didChangeTabsFrom = (prevLabel: string, currLabel: string) => {
    const { didChangeTabsFrom, user, accountHasTracks } = this.props
    if (user) {
      let tab = `/${currLabel.toLowerCase()}`
      const isOwner = this.getIsOwner()
      if (user.track_count > 0 || (isOwner && accountHasTracks)) {
        // An artist, default route is tracks
        if (currLabel === ProfilePageTabs.TRACKS) {
          tab = ''
        }
      } else {
        // A normal user, default route is reposts
        if (currLabel === ProfilePageTabs.REPOSTS) {
          tab = ''
        }
      }
      window.history.replaceState(
        {},
        '', // title -- unused, overriden by helmet
        `/${user.handle}${tab}`
      )
    }
    didChangeTabsFrom(prevLabel, currLabel)
    this.setState({ activeTab: currLabel as ProfilePageTabs })
  }

  getIsArtist = () => {
    const { user, accountHasTracks } = this.props
    const isOwner = this.getIsOwner()
    return !!((user && user.track_count > 0) || (isOwner && accountHasTracks))
  }

  getIsOwner = (overrideProps?: ProfilePageProps) => {
    const { user, accountUserId } = overrideProps || this.props
    return user && accountUserId ? user.user_id === accountUserId : false
  }

  onMessage = () => {
    const { user } = this.props
    // Handle logged-out case, redirect to signup
    if (
      this.props.chatPermissions.callToAction === ChatPermissionAction.SIGN_UP
    ) {
      return this.props.redirectUnauthenticatedAction()
    }

    if (this.props.chatPermissions?.canCreateChat) {
      return this.props.onMessage(user!.user_id)
    } else if (user) {
      this.props.onShowInboxUnavailableModal(user.user_id)
    }
  }

  onBlock = () => {
    return this.setState({ showBlockUserConfirmationModal: true })
  }

  onUnblock = () => {
    return this.setState({ showUnblockUserConfirmationModal: true })
  }

  onMute = () => {
    return this.setState({ showMuteUserConfirmationModal: true })
  }

  onUnmute = () => {
    return this.setState({ showUnmuteUserConfirmationModal: true })
  }

  render() {
    const {
      user,
      profile: { status: profileLoadingStatus, isSubscribed },
      accountUserId,
      goToRoute,
      createPlaylist,
      currentQueueItem,
      setNotificationSubscription,
      setFollowingUserId,
      setFollowersUserId
    } = this.props
    const {
      activeTab,
      editMode,
      shouldMaskContent,
      areArtistRecommendationsVisible,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedTikTokHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

    const isArtist = this.getIsArtist()
    const isOwner = this.getIsOwner()
    const mode = this.getMode(isOwner)
    const stats = this.getStats(isArtist)

    const userId = user ? user.user_id : null
    const handle = user ? user.handle : ''
    const verified = user ? user.is_verified : false
    const twitterVerified = !!user?.verified_with_twitter
    const instagramVerified = !!user?.verified_with_instagram
    const tikTokVerified = !!user?.verified_with_tiktok
    const created = user
      ? moment(user.created_at).format('YYYY')
      : moment().format('YYYY')

    const name = user ? updatedName || user.name || '' : ''
    const bio = user ? (updatedBio !== null ? updatedBio : user.bio || '') : ''
    const location = user
      ? updatedLocation !== null
        ? updatedLocation
        : user.location || ''
      : ''
    const twitterHandle = user
      ? updatedTwitterHandle !== null
        ? updatedTwitterHandle
        : twitterVerified && !verifiedHandleWhitelist.has(handle)
          ? user.handle
          : user.twitter_handle || ''
      : ''
    const instagramHandle = user
      ? updatedInstagramHandle !== null
        ? updatedInstagramHandle
        : instagramVerified
          ? user.handle
          : user.instagram_handle || ''
      : ''
    const tikTokHandle = user
      ? updatedTikTokHandle !== null
        ? updatedTikTokHandle
        : tikTokVerified
          ? user.handle
          : user.tiktok_handle || ''
      : ''
    const website = user
      ? updatedWebsite !== null
        ? updatedWebsite
        : user.website || ''
      : ''
    const donation = user
      ? updatedDonation !== null
        ? updatedDonation
        : user.donation || ''
      : ''
    const hasProfilePicture = user
      ? !!user.profile_picture ||
        !!user.profile_picture_sizes ||
        updatedProfilePicture
      : false

    const dropdownDisabled =
      activeTab === ProfilePageTabs.REPOSTS ||
      activeTab === ProfilePageTabs.COLLECTIBLES
    const following = !!user && user.does_current_user_follow

    const childProps = {
      // Computed
      accountUserId,
      userId,
      isArtist,
      isOwner,
      handle,
      verified,
      created,
      name,
      bio,
      location,
      twitterHandle,
      instagramHandle,
      tikTokHandle,
      website,
      donation,
      hasProfilePicture,
      following,
      mode,
      stats,
      activeTab,
      twitterVerified,
      instagramVerified,
      tikTokVerified,

      profile: user,
      status: profileLoadingStatus,
      goToRoute,

      // Methods
      changeTab: this.changeTab,
      getLineupProps: this.getLineupProps,
      onSortByRecent: this.onSortByRecent,
      onSortByPopular: this.onSortByPopular,
      setFollowingUserId,
      setFollowersUserId,
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      onShare: this.onShare,
      onEdit: this.onEdit,
      onSave: this.onSave,
      onCancel: this.onCancel,
      updateProfilePicture: this.updateProfilePicture,
      updateName: this.updateName,
      updateBio: this.updateBio,
      updateLocation: this.updateLocation,
      updateTwitterHandle: this.updateTwitterHandle,
      updateInstagramHandle: this.updateInstagramHandle,
      updateTikTokHandle: this.updateTikTokHandle,
      updateWebsite: this.updateWebsite,
      updateDonation: this.updateDonation,
      updateCoverPhoto: this.updateCoverPhoto,
      didChangeTabsFrom: this.didChangeTabsFrom,
      onMessage: this.onMessage,
      onBlock: this.onBlock,
      onUnblock: this.onUnblock,
      onMute: this.onMute,
      trackSortMode: this.state.tracksLineupOrder
    }

    const mobileProps = {
      trackIsActive: !!currentQueueItem,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      hasMadeEdit:
        updatedName !== null ||
        updatedBio !== null ||
        updatedLocation !== null ||
        updatedTwitterHandle !== null ||
        updatedInstagramHandle !== null ||
        updatedTikTokHandle !== null ||
        updatedWebsite !== null ||
        updatedDonation !== null ||
        updatedCoverPhoto !== null ||
        updatedProfilePicture !== null,
      onClickMobileOverflow: this.props.clickOverflow
    }

    const desktopProps = {
      editMode,
      shouldMaskContent,

      areArtistRecommendationsVisible,
      onCloseArtistRecommendations: this.onCloseArtistRecommendations,
      setNotificationSubscription,
      isSubscribed: !!isSubscribed,

      dropdownDisabled,
      updatedCoverPhoto,
      updatedProfilePicture,

      createPlaylist,

      updateProfile: this.props.updateProfile,
      isBlocked: this.props.user
        ? this.props.blockeeList.includes(this.props.user.user_id)
        : false,
      canCreateChat:
        // In the signed out case, we show the chat button (but redirect to signup)
        this.props.chatPermissions.canCreateChat ||
        this.props.chatPermissions.callToAction ===
          ChatPermissionAction.SIGN_UP,
      showBlockUserConfirmationModal: this.state.showBlockUserConfirmationModal,
      onCloseBlockUserConfirmationModal: this.onCloseBlockUserConfirmationModal,
      showUnblockUserConfirmationModal:
        this.state.showUnblockUserConfirmationModal,
      onCloseUnblockUserConfirmationModal:
        this.onCloseUnblockUserConfirmationModal,
      showMuteUserConfirmationModal: this.state.showMuteUserConfirmationModal,
      onCloseMuteUserConfirmationModal: this.onCloseMuteUserConfirmationModal
    }

    return (
      // @ts-ignore wrong lineup type
      <this.props.children
        key={getPathname(this.props.location)}
        {...childProps}
        {...mobileProps}
        {...desktopProps}
      />
    )
  }
}

function makeMapStateToProps() {
  const getProfile = makeGetProfile()
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (
    state: AppState,
    props: RouteComponentProps & { user?: UserMetadata }
  ) => {
    const { location, user } = props
    const pathname = getPathname(location)
    const params = parseUserRoute(pathname)
    const handleLower = params?.handle?.toLowerCase() as string

    const profile = getProfile(state)
    const accountUserId = getUserId(state)
    const accountHasTracks =
      accountUserId === user?.user_id ? getAccountHasTracks(state) : null
    return {
      accountUserId,
      profile,
      artistTracks: getProfileTracksLineup(state, handleLower),
      userFeed: getProfileFeedLineup(state, handleLower),
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      pathname: getLocationPathname(state),
      chatPermissions: getCanCreateChat(state, {
        userId: user?.user_id
      }),
      blockeeList: getBlockees(state),
      blockerList: getBlockers(state),
      accountHasTracks
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch, props: RouteComponentProps) {
  const { location } = props
  const pathname = getPathname(location)
  const params = parseUserRoute(pathname)
  const handleLower = params?.handle?.toLowerCase() as string

  return {
    setCurrentUser: (handle: string) =>
      dispatch(profileActions.setCurrentUser(handle)),
    fetchAccountHasTracks: () => {
      dispatch(fetchHasTracks())
    },
    goToRoute: (route: string) => dispatch(push(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    updateCollectionOrder: (mode: CollectionSortMode) =>
      dispatch(profileActions.updateCollectionSortMode(mode, handleLower)),
    onFollow: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.PROFILE_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(socialActions.unfollowUser(userId, FollowSource.PROFILE_PAGE)),
    onShare: (userId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      ),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),

    createPlaylist: () =>
      dispatch(
        createPlaylist(
          { playlist_name: 'Create Playlist' },
          CreatePlaylistSource.PROFILE_PAGE
        )
      ),
    setNotificationSubscription: (
      userId: ID,
      isSubscribed: boolean,
      update = false
    ) =>
      dispatch(
        profileActions.setNotificationSubscription(
          userId,
          isSubscribed,
          update,
          handleLower
        )
      ),

    setFollowingUserId: (userId: ID) => dispatch(setFollowing(userId)),
    setFollowersUserId: (userId: ID) => dispatch(setFollowers(userId)),

    clickOverflow: (userId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.PROFILE, id: userId, overflowActions })
      ),

    didChangeTabsFrom: (prevLabel: string, currLabel: string) => {
      if (prevLabel !== currLabel) {
        const trackEvent: TrackEvent = make(Name.PROFILE_PAGE_TAB_CLICK, {
          tab: currLabel.toLowerCase() as
            | 'tracks'
            | 'albums'
            | 'reposts'
            | 'playlists'
            | 'collectibles'
        })
        dispatch(trackEvent)
      }
    },
    trackUpdateSort: (sort: 'recent' | 'popular') => {
      const trackEvent: TrackEvent = make(Name.PROFILE_PAGE_SORT, { sort })
      dispatch(trackEvent)
    },
    recordUpdateProfilePicture: (source: 'original' | 'unsplash' | 'url') => {
      const trackEvent: TrackEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_PROFILE_PICTURE,
        { source }
      )
      dispatch(trackEvent)
    },
    recordUpdateCoverPhoto: (source: 'original' | 'unsplash' | 'url') => {
      const trackEvent: TrackEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_COVER_PHOTO,
        { source }
      )
      dispatch(trackEvent)
    },
    onMessage: (userId: ID) => {
      dispatch(createChat({ userIds: [userId] }))
      dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'profile' }))
    },
    onBlock: (userId: ID) => {
      dispatch(blockUser({ userId }))
    },
    onUnblock: (userId: ID) => {
      dispatch(unblockUser({ userId }))
    },
    redirectUnauthenticatedAction: () => {
      dispatch(openSignOn())
      dispatch(showRequiresAccountToast())
    },
    onShowInboxUnavailableModal: (userId: ID) => {
      dispatch(inboxUnavailableModalActions.open({ userId }))
    }
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ProfilePageProvider)
)
