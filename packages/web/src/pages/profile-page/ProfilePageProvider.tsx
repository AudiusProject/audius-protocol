import { ComponentType, RefObject, useEffect, useRef, useState } from 'react'

import {
  Name,
  ShareSource,
  FollowSource,
  CreatePlaylistSource,
  Status,
  ID,
  UID
} from '@audius/common/models'
import { newUserMetadata } from '@audius/common/schemas'
import {
  accountActions,
  accountSelectors,
  cacheCollectionsActions,
  profilePageFeedLineupActions as feedActions,
  profilePageTracksLineupActions as tracksActions,
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
import { getErrorMessage, Nullable, route } from '@audius/common/utils'
import { UnregisterCallback } from 'history'
import moment from 'moment'
import { connect } from 'react-redux'
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
const { getUserId } = accountSelectors
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
}

type ProfilePageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type ProfilePageState = {
  activeTab: ProfilePageTabs | null
  editMode: boolean
  shouldMaskContent: boolean
  updatedName: string | null
  updatedCoverPhoto: any | null
  updatedProfilePicture: any | null
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

const ProfilePage = (props: ProfilePageProps) => {
  const [state, setState] = useState<ProfilePageState>({
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
  })

  const unlistenRef = useRef<UnregisterCallback>()
  const prevPropsRef = useRef(props)
  const accountHasTracks = false

  useEffect(() => {
    // If routing from a previous profile page
    // the lineups must be reset to refetch & update for new user
    props.fetchProfile(getPathname(props.location), null, false, true)

    // Switching from profile page => profile page
    unlistenRef.current = props.history.listen((location, action) => {
      // If changing pages or "POP" on router (with goBack, the pathnames are equal)
      if (
        getPathname(props.location) !== getPathname(location) ||
        action === 'POP'
      ) {
        const params = parseUserRoute(getPathname(location))
        if (params) {
          // Fetch profile if this is a new profile page
          props.fetchProfile(getPathname(location), null, false, true)
        }
        setState((prevState) => ({
          ...prevState,
          activeTab: null,
          ...INITIAL_UPDATE_FIELDS
        }))
      }
    })

    return () => {
      if (unlistenRef.current) {
        // Push unlisten to end of event loop. On some browsers, the back button
        // will cause the component to unmount and remove the unlisten faster than
        // the history listener will run. See [AUD-403].
        setImmediate(unlistenRef.current)
      }
    }
  }, [props, props.history, props.location])

  useEffect(() => {
    const prevProps = prevPropsRef.current
    const { pathname, profile, artistTracks, goToRoute, accountUserId } = props
    const { editMode, activeTab } = state

    if (profile && profile.status === Status.ERROR) {
      goToRoute(NOT_FOUND_PAGE)
    }

    const isOwnProfile = accountUserId === profile.profile?.user_id
    const hasTracks =
      (profile.profile && profile.profile.track_count > 0) ||
      (isOwnProfile && accountHasTracks)

    if (!isOwnProfile || accountHasTracks !== null) {
      if (
        !activeTab &&
        profile &&
        profile.profile &&
        artistTracks!.status === Status.SUCCESS
      ) {
        if (hasTracks) {
          setState((prevState) => ({
            ...prevState,
            activeTab: ProfilePageTabs.TRACKS
          }))
        } else {
          setState((prevState) => ({
            ...prevState,
            activeTab: ProfilePageTabs.REPOSTS
          }))
        }
      } else if (!activeTab && profile && profile.profile && !hasTracks) {
        setState((prevState) => ({
          ...prevState,
          activeTab: ProfilePageTabs.REPOSTS
        }))
      }
    }

    // Replace the URL with the properly formatted /handle route
    if (profile && profile.profile && profile.status === Status.SUCCESS) {
      const params = parseUserRoute(pathname)
      if (params) {
        const { handle } = params
        if (handle === null) {
          const newPath = profilePage(profile.profile.handle)
          props.replaceRoute(newPath)
        }
      }
    }

    if (prevProps.profile?.profile?.handle !== profile?.profile?.handle) {
      // If editing profile and route to another user profile, exit edit mode
      if (editMode) {
        setState((prevState) => ({
          ...prevState,
          editMode: false
        }))
      }
      // Close artist recommendations when the profile changes
      setState((prevState) => ({
        ...prevState,
        areArtistRecommendationsVisible: false
      }))
    }

    prevPropsRef.current = props
  }, [
    props.profile,
    props.artistTracks,
    props.goToRoute,
    props.accountUserId,
    accountHasTracks,
    state.editMode,
    state.activeTab,
    props,
    state
  ])

  const onFollow = () => {
    const {
      profile: { profile }
    } = props
    if (!profile) return
    props.onFollow(profile.user_id)
    setState((prevState) => ({
      ...prevState,
      areArtistRecommendationsVisible: true
    }))
  }

  const onUnfollow = () => {
    const {
      profile: { profile }
    } = props
    if (!profile) return
    const userId = profile.user_id
    props.onUnfollow(userId)
  }

  const onCloseArtistRecommendations = () => {
    setState((prevState) => ({
      ...prevState,
      areArtistRecommendationsVisible: false
    }))
  }

  const onCloseBlockUserConfirmationModal = () => {
    setState((prevState) => ({
      ...prevState,
      showBlockUserConfirmationModal: false
    }))
  }

  const onCloseUnblockUserConfirmationModal = () => {
    setState((prevState) => ({
      ...prevState,
      showUnblockUserConfirmationModal: false
    }))
  }

  const onCloseMuteUserConfirmationModal = () => {
    setState((prevState) => ({
      ...prevState,
      showMuteUserConfirmationModal: false
    }))
  }

  const onCloseUnmuteUserConfirmationModal = () => {
    setState((prevState) => ({
      ...prevState,
      showUnmuteUserConfirmationModal: false
    }))
  }

  const fetchProfile = (
    pathname: string,
    forceUpdate = false,
    shouldSetLoading = true
  ) => {
    const params = parseUserRoute(pathname)
    if (params) {
      props.fetchProfile(
        params?.handle?.toLowerCase() ?? null,
        params.userId,
        forceUpdate,
        shouldSetLoading
      )
      if (params.tab) {
        setState((prevState) => ({
          ...prevState,
          activeTab: getTabForRoute(params.tab)
        }))
      }
    } else {
      props.goToRoute(NOT_FOUND_PAGE)
    }
  }

  const refreshProfile = () => {
    fetchProfile(getPathname(props.location), true, false)
  }

  const updateName = (name: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedName: name
    }))
  }

  const updateCoverPhoto = async (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file, 2000, /* square= */ false)
      const url = URL.createObjectURL(file)
      setState((prevState) => ({
        ...prevState,
        updatedCoverPhoto: { file, url, source }
      }))
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        updatedCoverPhoto: {
          ...(prevState.updatedCoverPhoto || {}),
          error: getErrorMessage(error)
        }
      }))
    }
  }

  const updateProfilePicture = async (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      setState((prevState) => ({
        ...prevState,
        updatedProfilePicture: { file, url, source }
      }))
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        updatedProfilePicture: {
          ...(prevState.updatedProfilePicture &&
          prevState.updatedProfilePicture.url
            ? prevState.updatedProfilePicture
            : {}),
          error: getErrorMessage(error)
        }
      }))
    }
  }

  const updateBio = (bio: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedBio: bio
    }))
  }

  const updateLocation = (location: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedLocation: location
    }))
  }

  const updateTwitterHandle = (handle: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedTwitterHandle: handle
    }))
  }

  const updateInstagramHandle = (handle: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedInstagramHandle: handle
    }))
  }

  const updateTikTokHandle = (handle: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedTikTokHandle: handle
    }))
  }

  const updateWebsite = (website: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedWebsite: website
    }))
  }

  const updateDonation = (donation: string) => {
    setState((prevState) => ({
      ...prevState,
      updatedDonation: donation
    }))
  }

  const changeTab = (tab: ProfilePageTabs) => {
    setState((prevState) => ({
      ...prevState,
      activeTab: tab
    }))

    // Once the hero card settles into place, then turn the mask off
    setTimeout(() => {
      const firstTab = getIsArtist() ? 'Tracks' : 'Reposts'
      setState((prevState) => ({
        ...prevState,
        shouldMaskContent: tab !== firstTab
      }))
    }, 300)
  }

  const getLineupProps = (lineup: any) => {
    const { currentQueueItem, playing, buffering, containerRef } = props
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

  const getMode = (isOwner: boolean): ProfileMode => {
    return isOwner ? (state.editMode ? 'editing' : 'owner') : 'visitor'
  }

  const onEdit = () => {
    setState((prevState) => ({
      ...prevState,
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
    }))
  }

  const onSave = () => {
    const {
      profile: { profile },
      recordUpdateCoverPhoto,
      recordUpdateProfilePicture
    } = props
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
    } = state

    const updatedMetadata = newUserMetadata({ ...profile })
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
    props.updateProfile(updatedMetadata)
    setState((prevState) => ({
      ...prevState,
      editMode: false
    }))
  }

  const onCancel = () => {
    setState((prevState) => ({
      ...prevState,
      editMode: false,
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
    }))
  }

  const getStats = (isArtist: boolean): StatProps[] => {
    const {
      profile: { profile }
    } = props

    let trackCount = 0
    let playlistCount = 0
    let followerCount = 0
    let followingCount = 0

    if (profile) {
      trackCount = profile.track_count
      playlistCount = profile.playlist_count
      followerCount = profile.follower_count
      followingCount = profile.followee_count
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

  const onSortByRecent = () => {
    const {
      artistTracks,
      updateCollectionOrder,
      profile: { profile },
      trackUpdateSort
    } = props
    if (!profile) return
    setState((prevState) => ({
      ...prevState,
      tracksLineupOrder: TracksSortMode.RECENT
    }))
    updateCollectionOrder(CollectionSortMode.TIMESTAMP)
    trackUpdateSort('recent')
    props.loadMoreArtistTracks(
      0,
      artistTracks!.entries.length,
      profile.user_id,
      TracksSortMode.RECENT
    )
  }

  const onSortByPopular = () => {
    const {
      artistTracks,
      updateCollectionOrder,
      profile: { profile },
      trackUpdateSort
    } = props
    if (!profile) return
    setState((prevState) => ({
      ...prevState,
      tracksLineupOrder: TracksSortMode.POPULAR
    }))
    props.loadMoreArtistTracks(
      0,
      artistTracks!.entries.length,
      profile.user_id,
      TracksSortMode.POPULAR
    )
    updateCollectionOrder(CollectionSortMode.SAVE_COUNT)
    trackUpdateSort('popular')
  }

  const loadMoreArtistTracks = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = props
    if (!profile) return
    props.loadMoreArtistTracks(
      offset,
      limit,
      profile.user_id,
      state.tracksLineupOrder
    )
  }

  const didChangeTabsFrom = (prevLabel: string, currLabel: string) => {
    const {
      didChangeTabsFrom,
      profile: { profile }
    } = props
    if (profile) {
      let tab = `/${currLabel.toLowerCase()}`
      const isOwner = getIsOwner()
      if (profile.track_count > 0 || (isOwner && accountHasTracks)) {
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
        `/${profile.handle}${tab}`
      )
    }
    didChangeTabsFrom(prevLabel, currLabel)
    setState((prevState) => ({
      ...prevState,
      activeTab: currLabel as ProfilePageTabs
    }))
  }

  const loadMoreUserFeed = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = props
    if (!profile) return
    props.loadMoreUserFeed(offset, limit, profile.user_id)
  }

  const getIsArtist = () => {
    const {
      profile: { profile }
    } = props
    const isOwner = getIsOwner()
    return !!(
      (profile && profile.track_count > 0) ||
      (isOwner && accountHasTracks)
    )
  }

  const getIsOwner = (overrideProps?: ProfilePageProps) => {
    const {
      profile: { profile },
      accountUserId
    } = overrideProps || props
    return profile && accountUserId ? profile.user_id === accountUserId : false
  }

  const onMessage = () => {
    const {
      profile: { profile }
    } = props
    // Handle logged-out case, redirect to signup
    if (props.chatPermissions.callToAction === ChatPermissionAction.SIGN_UP) {
      return props.redirectUnauthenticatedAction()
    }

    if (props.chatPermissions?.canCreateChat) {
      return props.onMessage(profile!.user_id)
    } else if (profile) {
      props.onShowInboxUnavailableModal(profile.user_id)
    }
  }

  const onBlock = () => {
    setState((prevState) => ({
      ...prevState,
      showBlockUserConfirmationModal: true
    }))
  }

  const onUnblock = () => {
    setState((prevState) => ({
      ...prevState,
      showUnblockUserConfirmationModal: true
    }))
  }

  const onMute = () => {
    setState((prevState) => ({
      ...prevState,
      showMuteUserConfirmationModal: true
    }))
  }

  const {
    profile: { profile, status: profileLoadingStatus, isSubscribed },
    // Tracks
    artistTracks,
    playArtistTrack,
    pauseArtistTrack,
    // Feed
    userFeed,
    playUserFeedTrack,
    pauseUserFeedTrack,
    accountUserId,
    goToRoute,
    createPlaylist,
    currentQueueItem,
    setNotificationSubscription,
    setFollowingUserId,
    setFollowersUserId
  } = props
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
  } = state

  const isArtist = getIsArtist()
  const isOwner = getIsOwner()
  const mode = getMode(isOwner)
  const stats = getStats(isArtist)

  const userId = profile ? profile.user_id : null
  const handle = profile ? `@${profile.handle}` : ''
  const verified = profile ? profile.is_verified : false
  const twitterVerified = !!profile?.verified_with_twitter
  const instagramVerified = !!profile?.verified_with_instagram
  const tikTokVerified = !!profile?.verified_with_tiktok
  const created = profile
    ? moment(profile.created_at).format('YYYY')
    : moment().format('YYYY')

  const name = profile ? updatedName || profile.name || '' : ''
  const bio = profile
    ? updatedBio !== null
      ? updatedBio
      : profile.bio || ''
    : ''
  const location = profile
    ? updatedLocation !== null
      ? updatedLocation
      : profile.location || ''
    : ''
  const twitterHandle = profile
    ? updatedTwitterHandle !== null
      ? updatedTwitterHandle
      : twitterVerified && !verifiedHandleWhitelist.has(handle)
        ? profile.handle
        : profile.twitter_handle || ''
    : ''
  const instagramHandle = profile
    ? updatedInstagramHandle !== null
      ? updatedInstagramHandle
      : instagramVerified
        ? profile.handle
        : profile.instagram_handle || ''
    : ''
  const tikTokHandle = profile
    ? updatedTikTokHandle !== null
      ? updatedTikTokHandle
      : tikTokVerified
        ? profile.handle
        : profile.tiktok_handle || ''
    : ''
  const website = profile
    ? updatedWebsite !== null
      ? updatedWebsite
      : profile.website || ''
    : ''
  const donation = profile
    ? updatedDonation !== null
      ? updatedDonation
      : profile.donation || ''
    : ''
  const hasProfilePicture = profile
    ? !!profile.profile_picture ||
      !!profile.profile_picture_sizes ||
      updatedProfilePicture
    : false

  const dropdownDisabled =
    activeTab === ProfilePageTabs.REPOSTS ||
    activeTab === ProfilePageTabs.COLLECTIBLES
  const following = !!profile && profile.does_current_user_follow

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

    profile,
    status: profileLoadingStatus,
    artistTracks,
    playArtistTrack,
    pauseArtistTrack,
    goToRoute,

    // Methods
    changeTab,
    getLineupProps,
    onSortByRecent,
    onSortByPopular,
    loadMoreArtistTracks,
    loadMoreUserFeed,
    refreshProfile,
    setFollowingUserId,
    setFollowersUserId,
    onFollow,
    onUnfollow,
    onShare: props.onShare,
    onEdit,
    onSave,
    onCancel,
    updateProfilePicture,
    updateName,
    updateBio,
    updateLocation,
    updateTwitterHandle,
    updateInstagramHandle,
    updateTikTokHandle,
    updateWebsite,
    updateDonation,
    updateCoverPhoto,
    didChangeTabsFrom,
    onMessage,
    onBlock,
    onUnblock,
    onMute,
    onCloseBlockUserConfirmationModal,
    onCloseUnblockUserConfirmationModal,
    onCloseMuteUserConfirmationModal,
    onCloseUnmuteUserConfirmationModal
  }

  const mobileProps = {
    trackIsActive: !!currentQueueItem,
    onConfirmUnfollow: props.onConfirmUnfollow,
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
    onClickMobileOverflow: props.clickOverflow
  }

  const desktopProps = {
    editMode,
    shouldMaskContent,

    areArtistRecommendationsVisible,
    onCloseArtistRecommendations,
    setNotificationSubscription,
    isSubscribed: !!isSubscribed,

    userFeed,
    playUserFeedTrack,
    pauseUserFeedTrack,

    dropdownDisabled,
    updatedCoverPhoto,
    updatedProfilePicture,

    createPlaylist,

    updateProfile: props.updateProfile,
    isBlocked: props.profile.profile
      ? props.blockeeList.includes(props.profile.profile.user_id)
      : false,
    canCreateChat:
      // In the signed out case, we show the chat button (but redirect to signup)
      props.chatPermissions.canCreateChat ||
      props.chatPermissions.callToAction === ChatPermissionAction.SIGN_UP,
    showBlockUserConfirmationModal: state.showBlockUserConfirmationModal,
    onCloseBlockUserConfirmationModal,
    showUnblockUserConfirmationModal: state.showUnblockUserConfirmationModal,
    onCloseUnblockUserConfirmationModal,
    showMuteUserConfirmationModal: state.showMuteUserConfirmationModal,
    onCloseMuteUserConfirmationModal
  }

  return (
    // @ts-ignore wrong lineup type
    <props.children
      key={getPathname(props.location)}
      {...childProps}
      {...mobileProps}
      {...desktopProps}
    />
  )
}

function makeMapStateToProps() {
  const getProfile = makeGetProfile()
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState, props: RouteComponentProps) => {
    const { location } = props
    const pathname = getPathname(location)
    const params = parseUserRoute(pathname)
    const handleLower = params?.handle?.toLowerCase() as string

    const profile = getProfile(state)
    const accountUserId = getUserId(state)
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
        userId: profile.profile?.user_id
      }),
      blockeeList: getBlockees(state),
      blockerList: getBlockers(state)
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
    fetchProfile: (
      handle: Nullable<string>,
      userId: ID | null,
      forceUpdate: boolean,
      shouldSetLoading: boolean,
      deleteExistingEntry: boolean = false
    ) =>
      dispatch(
        profileActions.fetchProfile(
          handle,
          userId,
          forceUpdate,
          shouldSetLoading,
          deleteExistingEntry
        )
      ),
    fetchAccountHasTracks: () => {
      dispatch(fetchHasTracks())
    },
    updateProfile: (metadata: any) =>
      dispatch(profileActions.updateProfile(metadata)),
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

    // Artist Tracks
    loadMoreArtistTracks: (
      offset: number,
      limit: number,
      id: ID,
      sort: TracksSortMode
    ) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(
          offset,
          limit,
          false,
          {
            userId: id,
            sort
          },
          { handle: handleLower }
        )
      )
    },
    playArtistTrack: (uid: string) => dispatch(tracksActions.play(uid)),
    pauseArtistTrack: () => dispatch(tracksActions.pause()),
    // User Feed
    loadMoreUserFeed: (offset: number, limit: number, id: ID) =>
      dispatch(
        feedActions.fetchLineupMetadatas(
          offset,
          limit,
          false,
          { userId: id },
          { handle: handleLower }
        )
      ),
    playUserFeedTrack: (uid: UID) => dispatch(feedActions.play(uid)),
    pauseUserFeedTrack: () => dispatch(feedActions.pause()),
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
  connect(makeMapStateToProps, mapDispatchToProps)(ProfilePage)
)
