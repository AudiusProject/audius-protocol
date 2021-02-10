import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { push as pushRoute, replace } from 'connected-react-router'
import moment from 'moment'
import { UnregisterCallback } from 'history'
import { AppState, Kind, Status } from 'store/types'
import { Dispatch } from 'redux'
import { Tabs, FollowType, TracksSortMode } from './store/types'
import { ID, UID } from 'models/common/Identifiers'

import { resizeImage } from 'utils/imageProcessingUtil'

import * as profileActions from './store/actions'
import * as socialActions from 'store/social/users/actions'
import * as createPlaylistModalActions from 'store/application/ui/createPlaylistModal/actions'
import * as unfollowConfirmationActions from 'containers/unfollow-confirmation-modal/store/actions'
import { open } from 'store/application/ui/mobileOverflowModal/actions'
import { tracksActions } from './store/lineups/tracks/actions'
import { feedActions } from './store/lineups/feed/actions'
import { makeGetLineupMetadatas } from 'store/lineup/selectors'
import { getAccountUser } from 'store/account/selectors'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { getLocationPathname } from 'store/routing/selectors'

import { makeGetCurrent } from 'store/queue/selectors'
import {
  makeGetProfile,
  getProfileFeedLineup,
  getProfileTracksLineup
} from './store/selectors'
import { CollectionSortMode } from 'containers/profile-page/store/types'
import { NOT_FOUND_PAGE, profilePage } from 'utils/route'
import { newUserMetadata } from 'schemas'
import { formatCount } from 'utils/formatUtil'

import { ProfilePageProps as DesktopProfilePageProps } from './components/desktop/ProfilePage'
import { ProfilePageProps as MobileProfilePageProps } from './components/mobile/ProfilePage'
import { setFollowing } from 'containers/following-page/store/actions'
import { setFollowers } from 'containers/followers-page/store/actions'
import {
  OverflowSource,
  OverflowAction
} from 'store/application/ui/mobileOverflowModal/types'
import { make, TrackEvent } from 'store/analytics/actions'
import { Name, FollowSource, ShareSource } from 'services/analytics'
import { parseUserRoute } from 'utils/route/userRouteParser'
import { verifiedHandleWhitelist } from 'utils/handleWhitelist'
import { makeKindId } from 'utils/uid'
import { getIsDone } from 'store/confirmer/selectors'

const INITIAL_UPDATE_FIELDS = {
  updatedName: null,
  updatedCoverPhoto: null,
  updatedProfilePicture: null,
  updatedBio: null,
  updatedLocation: null,
  updatedTwitterHandle: null,
  updatedInstagramHandle: null,
  updatedWebsite: null,
  updatedDonation: null
}

type OwnProps = {
  containerRef: React.RefObject<HTMLDivElement>
  children:
    | React.ComponentType<MobileProfilePageProps>
    | React.ComponentType<DesktopProfilePageProps>
}

type ProfilePageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type ProfilePageState = {
  activeTab: Tabs | null
  editMode: boolean
  shouldMaskContent: boolean
  updatedName: string | null
  updatedCoverPhoto: any | null
  updatedProfilePicture: any | null
  updatedBio: string | null
  updatedLocation: string | null
  updatedTwitterHandle: string | null
  updatedInstagramHandle: string | null
  updatedWebsite: string | null
  updatedDonation: string | null
  tracksLineupOrder: TracksSortMode
}

class ProfilePage extends PureComponent<ProfilePageProps, ProfilePageState> {
  static defaultProps = {}

  state: ProfilePageState = {
    activeTab: null,
    editMode: false,
    shouldMaskContent: false,
    tracksLineupOrder: TracksSortMode.RECENT,
    ...INITIAL_UPDATE_FIELDS
  }

  unlisten!: UnregisterCallback

  componentDidMount() {
    // If routing from a previous profile page
    // the lineups must be reset to refetch & update for new user
    this.props.resetProfile()
    this.props.resetArtistTracks()
    this.props.resetUserFeedTracks()
    this.fetchProfile(this.props.location.pathname)

    // Switching from profile page => profile page
    this.unlisten = this.props.history.listen((location, action) => {
      // If changing pages or "POP" on router (with goBack, the pathnames are equal)
      if (
        this.props.location.pathname !== location.pathname ||
        action === 'POP'
      ) {
        this.props.resetProfile()
        this.props.resetArtistTracks()
        this.props.resetUserFeedTracks()
        const params = parseUserRoute(location.pathname)
        if (params) {
          // Fetch profile if this is a new profile page
          this.fetchProfile(location.pathname)
        }
        this.setState({
          ...INITIAL_UPDATE_FIELDS
        })
      }
    })
  }

  componentWillUnmount() {
    if (this.unlisten) this.unlisten()
  }

  componentDidUpdate(prevProps: ProfilePageProps, prevState: ProfilePageState) {
    const { pathname, profile, artistTracks, goToRoute } = this.props
    const { activeTab } = this.state

    if (profile && profile.status === Status.ERROR) {
      goToRoute(NOT_FOUND_PAGE)
    }

    if (
      !activeTab &&
      profile &&
      profile.profile &&
      artistTracks.status === Status.SUCCESS
    ) {
      if (profile.profile.is_creator || profile.profile.track_count > 0) {
        this.setState({
          activeTab: Tabs.TRACKS
        })
      } else {
        this.setState({
          activeTab: Tabs.REPOSTS
        })
      }
    } else if (
      !activeTab &&
      profile &&
      profile.profile &&
      !profile.profile.is_creator
    ) {
      this.setState({
        activeTab: Tabs.REPOSTS
      })
    }

    // Replace the URL with the properly formatted /handle route
    if (profile && profile.profile && profile.status === Status.SUCCESS) {
      const params = parseUserRoute(pathname)
      if (params) {
        const { handle } = params
        if (handle === null) {
          const newPath = profilePage(profile.profile.handle)
          this.props.replaceRoute(newPath)
        }
      }
    }
  }

  // Check that the sorted order has the _artist_pick track as the first
  updateOrderArtistPickCheck = (tracks: Array<{ track_id: ID }>) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return []
    const artistPick = profile._artist_pick
    const artistTrackIndex = tracks.findIndex(
      track => track.track_id === artistPick
    )
    if (artistTrackIndex > -1) {
      return [tracks[artistTrackIndex]]
        .concat(tracks.slice(0, artistTrackIndex))
        .concat(tracks.slice(artistTrackIndex + 1))
    }
    return tracks
  }

  onFollow = () => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.onFollow(profile.user_id)
    if (this.props.account) {
      this.props.updateCurrentUserFollows(true)
    }
  }

  onUnfollow = () => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    const userId = profile.user_id
    this.props.onUnfollow(userId)
    this.props.setNotificationSubscription(userId, false)

    if (this.props.account) {
      this.props.updateCurrentUserFollows(false)
    }
  }

  fetchProfile = (
    pathname: string,
    forceUpdate = false,
    shouldSetLoading = true,
    deleteExistingEntry = false
  ) => {
    const params = parseUserRoute(pathname)
    if (params) {
      this.props.fetchProfile(
        params.handle,
        params.userId,
        forceUpdate,
        shouldSetLoading,
        deleteExistingEntry
      )
    } else {
      this.props.goToRoute(NOT_FOUND_PAGE)
    }
  }

  refreshProfile = () => {
    this.fetchProfile(this.props.location.pathname, true, false, true)
  }

  updateName = (name: string) => {
    this.setState({
      updatedName: name
    })
  }

  updateCoverPhoto = async (
    selectedFiles: any,
    source: 'original' | 'unsplash'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file, 2000, /* square= */ false)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedCoverPhoto: { file, url, source }
      })
    } catch (err) {
      this.setState({
        updatedCoverPhoto: {
          ...(this.state.updatedCoverPhoto || {}),
          error: err.message
        }
      })
    }
  }

  updateProfilePicture = async (
    selectedFiles: any,
    source: 'original' | 'unsplash'
  ) => {
    try {
      let file = selectedFiles[0]
      file = await resizeImage(file)
      const url = URL.createObjectURL(file)
      this.setState({
        updatedProfilePicture: { file, url, source }
      })
    } catch (err) {
      const { updatedProfilePicture } = this.state
      this.setState({
        updatedProfilePicture: {
          ...(updatedProfilePicture && updatedProfilePicture.url
            ? this.state.updatedProfilePicture
            : {}),
          error: err.message
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

  changeTab = (tab: Tabs) => {
    this.setState({
      activeTab: tab
    })

    // Once the hero card settles into place, then turn the mask off
    setTimeout(() => {
      const firstTab = this.getIsArtist() ? 'TRACKS' : 'REPOSTS'
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

  getMode = (isOwner: boolean) => {
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
      updatedWebsite: null,
      updatedDonation: null
    })
  }

  onSave = () => {
    const {
      profile: { profile },
      recordUpdateCoverPhoto,
      recordUpdateProfilePicture
    } = this.props
    const {
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

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
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.onShare(profile.user_id)
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

  getStats = (isArtist: boolean) => {
    const {
      profile: { profile }
    } = this.props

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

  onSortByRecent = () => {
    const {
      artistTracks,
      updateCollectionOrder,
      profile: { profile },
      trackUpdateSort
    } = this.props
    if (!profile) return
    this.setState({ tracksLineupOrder: TracksSortMode.RECENT })
    updateCollectionOrder(CollectionSortMode.TIMESTAMP)
    trackUpdateSort('recent')
    this.props.loadMoreArtistTracks(
      0,
      artistTracks.entries.length,
      profile.user_id,
      TracksSortMode.RECENT
    )
  }

  onSortByPopular = () => {
    const {
      artistTracks,
      updateCollectionOrder,
      profile: { profile },
      trackUpdateSort
    } = this.props
    if (!profile) return
    this.setState({ tracksLineupOrder: TracksSortMode.POPULAR })
    this.props.loadMoreArtistTracks(
      0,
      artistTracks.entries.length,
      profile.user_id,
      TracksSortMode.POPULAR
    )
    updateCollectionOrder(CollectionSortMode.SAVE_COUNT)
    trackUpdateSort('popular')
  }

  loadMoreArtistTracks = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.loadMoreArtistTracks(
      offset,
      limit,
      profile.user_id,
      this.state.tracksLineupOrder
    )
  }

  didChangeTabsFrom = (prevLabel: string, currLabel: string) => {
    this.props.didChangeTabsFrom(prevLabel, currLabel)
    this.setState({ activeTab: currLabel as Tabs })
  }

  loadMoreUserFeed = (offset: number, limit: number) => {
    const {
      profile: { profile }
    } = this.props
    if (!profile) return
    this.props.loadMoreUserFeed(offset, limit, profile.user_id)
  }

  formatCardSecondaryText = (
    saves: number,
    tracks: number,
    isPrivate = false
  ) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const tracksText = tracks === 1 ? 'Track' : 'Tracks'
    if (isPrivate) return `Private • ${tracks} ${tracksText}`
    return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
  }

  fetchFollowers = () => {
    const {
      fetchFollowUsers,
      profile: { profile }
    } = this.props
    const followers = profile ? profile.followers.users : []
    if (
      !profile ||
      profile.followers.status === Status.LOADING ||
      profile.follower_count === followers.length
    )
      return
    fetchFollowUsers(FollowType.FOLLOWERS, 22, followers.length)
  }

  fetchFollowees = () => {
    const {
      fetchFollowUsers,
      profile: { profile }
    } = this.props
    const followees = profile ? profile.followees.users : []
    if (
      !profile ||
      profile.followees.status === Status.LOADING ||
      profile.followee_count === followees.length
    )
      return
    fetchFollowUsers(FollowType.FOLLOWEES, 22, followees.length)
  }

  fetchFolloweeFollows = () => {
    const {
      fetchFollowUsers,
      profile: { profile }
    } = this.props
    const followeeFollows = profile ? profile.followeeFollows.users : []
    // TODO: Add a check to compare the total number w/ the length of the current users in the store
    if (!profile || profile.followeeFollows.status === Status.LOADING) return
    fetchFollowUsers(FollowType.FOLLOWEE_FOLLOWS, 22, followeeFollows.length)
  }

  getIsArtist = () => {
    const { profile } = this.props.profile
    return !!profile && profile.track_count > 0
  }

  getIsOwner = () => {
    const {
      profile: { profile },
      account
    } = this.props
    return profile && account ? profile.user_id === account.user_id : false
  }

  render() {
    const {
      profile: {
        profile,
        status: profileLoadingStatus,
        albums,
        playlists,
        mostUsedTags,
        isSubscribed
      },
      // Tracks
      artistTracks,
      playArtistTrack,
      pauseArtistTrack,
      // Feed
      userFeed,
      playUserFeedTrack,
      pauseUserFeedTrack,
      account,
      goToRoute,
      openCreatePlaylistModal,
      currentQueueItem,
      setNotificationSubscription,
      setFollowingUserId,
      setFollowersUserId
    } = this.props
    const {
      activeTab,
      editMode,
      shouldMaskContent,
      updatedName,
      updatedBio,
      updatedLocation,
      updatedCoverPhoto,
      updatedProfilePicture,
      updatedTwitterHandle,
      updatedInstagramHandle,
      updatedWebsite,
      updatedDonation
    } = this.state

    const accountUserId = account ? account.user_id : null
    const isArtist = this.getIsArtist()
    const isOwner = this.getIsOwner()
    const mode = this.getMode(isOwner)
    const stats = this.getStats(isArtist)

    const userId = profile ? profile.user_id : null
    const handle = profile ? `@${profile.handle}` : ''
    const verified = profile ? profile.is_verified : false
    const twitterVerified = profile ? profile.twitterVerified : false
    const instagramVerified = profile ? profile.instagramVerified : false
    const created = profile
      ? moment(profile.created_at).format('YYYY')
      : moment().format('YYYY')

    const name = profile
      ? updatedName !== null
        ? updatedName
        : profile.name || ''
      : ''
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
        : profile.twitterVerified && !verifiedHandleWhitelist.has(handle)
        ? profile.handle
        : profile.twitter_handle || ''
      : ''
    const instagramHandle = profile
      ? updatedInstagramHandle !== null
        ? updatedInstagramHandle
        : profile.instagramVerified
        ? profile.handle
        : profile.instagram_handle || ''
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
    const profilePictureSizes = profile ? profile._profile_picture_sizes : null
    const coverPhotoSizes = profile ? profile._cover_photo_sizes : null
    const hasProfilePicture = profile
      ? !!profile.profile_picture ||
        !!profile.profile_picture_sizes ||
        updatedProfilePicture
      : false

    const followers = profile ? profile.followers.users : []
    const followersLoading = profile
      ? profile.followers.status === Status.LOADING
      : false
    const followees = profile ? profile.followees.users : []
    const followeesLoading = profile
      ? profile.followees.status === Status.LOADING
      : false
    const followeeFollows = profile ? profile.followeeFollows.users : []

    // TODO: update this value to be the total number of followee follow from the user metadata
    const followeeFollowsCount = profile
      ? profile.current_user_followee_follow_count
      : 0
    const followeeFollowsLoading = profile
      ? profile.followeeFollows.status === Status.LOADING
      : false

    const dropdownDisabled = activeTab === Tabs.REPOSTS
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
      website,
      donation,
      coverPhotoSizes,
      profilePictureSizes,
      hasProfilePicture,
      followers,
      followersLoading,
      following,
      mode,
      stats,
      activeTab,
      mostUsedTags,
      twitterVerified,
      instagramVerified,

      profile,
      status: profileLoadingStatus,
      albums,
      playlists,
      artistTracks,
      playArtistTrack,
      pauseArtistTrack,
      goToRoute,

      // Methods
      changeTab: this.changeTab,
      getLineupProps: this.getLineupProps,
      onSortByRecent: this.onSortByRecent,
      onSortByPopular: this.onSortByPopular,
      loadMoreArtistTracks: this.loadMoreArtistTracks,
      loadMoreUserFeed: this.loadMoreUserFeed,
      formatCardSecondaryText: this.formatCardSecondaryText,
      refreshProfile: this.refreshProfile,
      fetchFollowers: this.fetchFollowers,
      fetchFollowees: this.fetchFollowees,
      setFollowingUserId,
      setFollowersUserId,
      fetchFolloweeFollows: this.fetchFolloweeFollows,
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
      updateWebsite: this.updateWebsite,
      updateDonation: this.updateDonation,
      updateCoverPhoto: this.updateCoverPhoto,
      didChangeTabsFrom: this.didChangeTabsFrom
    }

    const mobileProps = {
      trackIsActive: !!currentQueueItem,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      isUserConfirming: this.props.isUserConfirming,
      hasMadeEdit:
        updatedName !== null ||
        updatedBio !== null ||
        updatedLocation !== null ||
        updatedTwitterHandle !== null ||
        updatedInstagramHandle !== null ||
        updatedWebsite !== null ||
        updatedDonation !== null ||
        updatedCoverPhoto !== null ||
        updatedProfilePicture !== null,
      onClickMobileOverflow: this.props.clickOverflow
    }

    const desktopProps = {
      editMode,
      shouldMaskContent,
      setNotificationSubscription,
      isSubscribed: !!isSubscribed,

      userFeed,
      playUserFeedTrack,
      pauseUserFeedTrack,

      followees,
      followeesLoading,
      followeeFollows,
      followeeFollowsCount,
      followeeFollowsLoading,
      dropdownDisabled,
      updatedCoverPhoto,
      updatedProfilePicture,

      openCreatePlaylistModal
    }

    return (
      <this.props.children
        key={this.props.location.pathname}
        {...childProps}
        {...mobileProps}
        {...desktopProps}
      />
    )
  }
}

function makeMapStateToProps() {
  const getArtistTracksMetadatas = makeGetLineupMetadatas(
    getProfileTracksLineup
  )
  const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)
  const getProfile = makeGetProfile()
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => ({
    account: getAccountUser(state),
    profile: getProfile(state, {}),
    artistTracks: getArtistTracksMetadatas(state),
    userFeed: getUserFeedMetadatas(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    pathname: getLocationPathname(state),
    isUserConfirming: !getIsDone(state, {
      uid: makeKindId(Kind.USERS, getAccountUser(state)?.user_id)
    })
  })
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchProfile: (
      handle: string | null,
      userId: ID | null,
      forceUpdate: boolean,
      shouldSetLoading: boolean,
      deleteExistingEntry: boolean
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
    updateProfile: (metadata: any) =>
      dispatch(profileActions.updateProfile(metadata)),
    resetProfile: () => dispatch(profileActions.resetProfile()),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    updateCollectionOrder: (mode: CollectionSortMode) =>
      dispatch(profileActions.updateCollectionSortMode(mode)),
    onFollow: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.PROFILE_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(socialActions.unfollowUser(userId, FollowSource.PROFILE_PAGE)),
    onShare: (userId: ID) =>
      dispatch(socialActions.shareUser(userId, ShareSource.PAGE)),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),
    updateCurrentUserFollows: (follow: any) =>
      dispatch(profileActions.updateCurrentUserFollows(follow)),

    // Artist Tracks
    loadMoreArtistTracks: (
      offset: number,
      limit: number,
      id: ID,
      sort: TracksSortMode
    ) => {
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, {
          userId: id,
          sort
        })
      )
    },
    resetArtistTracks: () => dispatch(tracksActions.reset()),
    playArtistTrack: (uid: string) => dispatch(tracksActions.play(uid)),
    pauseArtistTrack: () => dispatch(tracksActions.pause()),
    // User Feed
    loadMoreUserFeed: (offset: number, limit: number, id: ID) =>
      dispatch(
        feedActions.fetchLineupMetadatas(offset, limit, false, { userId: id })
      ),
    resetUserFeedTracks: () => dispatch(feedActions.reset()),
    playUserFeedTrack: (uid: UID) => dispatch(feedActions.play(uid)),
    pauseUserFeedTrack: () => dispatch(feedActions.pause()),
    // Followes
    fetchFollowUsers: (followGroup: any, limit: number, offset: number) =>
      dispatch(profileActions.fetchFollowUsers(followGroup, limit, offset)),

    openCreatePlaylistModal: () => dispatch(createPlaylistModalActions.open()),
    setNotificationSubscription: (userId: ID, isSubscribed: boolean) =>
      dispatch(
        profileActions.setNotificationSubscription(userId, isSubscribed, true)
      ),

    setFollowingUserId: (userId: ID) => dispatch(setFollowing(userId)),
    setFollowersUserId: (userId: ID) => dispatch(setFollowers(userId)),

    clickOverflow: (userId: ID, overflowActions: OverflowAction[]) =>
      dispatch(open(OverflowSource.PROFILE, userId, overflowActions)),

    didChangeTabsFrom: (prevLabel: string, currLabel: string) => {
      if (prevLabel !== currLabel) {
        const trackEvent: TrackEvent = make(Name.PROFILE_PAGE_TAB_CLICK, {
          tab: currLabel.toLowerCase() as
            | 'tracks'
            | 'albums'
            | 'reposts'
            | 'playlists'
        })
        dispatch(trackEvent)
      }
    },
    trackUpdateSort: (sort: 'recent' | 'popular') => {
      const trackEvent: TrackEvent = make(Name.PROFILE_PAGE_SORT, { sort })
      dispatch(trackEvent)
    },
    recordUpdateProfilePicture: (source: 'original' | 'unsplash') => {
      const trackEvent: TrackEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_PROFILE_PICTURE,
        { source }
      )
      dispatch(trackEvent)
    },
    recordUpdateCoverPhoto: (source: 'original' | 'unsplash') => {
      const trackEvent: TrackEvent = make(
        Name.ACCOUNT_HEALTH_UPLOAD_COVER_PHOTO,
        { source }
      )
      dispatch(trackEvent)
    }
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(ProfilePage)
)
