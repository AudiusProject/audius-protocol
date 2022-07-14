import { Component, ComponentType } from 'react'

import { ID, CID, PlayableType } from '@audius/common'
import { push as pushRoute, replace } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {
  FollowSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource
} from 'common/models/Analytics'
import { FavoriteType } from 'common/models/Favorite'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { getUserId } from 'common/store/account/selectors'
import * as cacheTrackActions from 'common/store/cache/tracks/actions'
import { makeGetLineupMetadatas } from 'common/store/lineup/selectors'
import * as trackPageActions from 'common/store/pages/track/actions'
import { tracksActions } from 'common/store/pages/track/lineup/actions'
import {
  getUser,
  getLineup,
  getTrackRank,
  getTrack,
  getRemixParentTrack,
  getStatus,
  getSourceSelector,
  getTrackPermalink
} from 'common/store/pages/track/selectors'
import { makeGetCurrent } from 'common/store/queue/selectors'
import * as socialTracksActions from 'common/store/social/tracks/actions'
import * as socialUsersActions from 'common/store/social/users/actions'
import { open } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { setFavorite } from 'common/store/user-list/favorites/actions'
import { setRepost } from 'common/store/user-list/reposts/actions'
import { RepostType } from 'common/store/user-list/reposts/types'
import { getCanonicalName } from 'common/utils/genres'
import { formatSeconds, formatDate } from 'common/utils/timeUtil'
import { Uid } from 'common/utils/uid'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import DeletedPage from 'pages/deleted-page/DeletedPage'
import { TrackEvent, make } from 'store/analytics/actions'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import {
  profilePage,
  searchResultsPage,
  NOT_FOUND_PAGE,
  FEED_PAGE,
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE,
  fullTrackPage,
  trackRemixesPage
} from 'utils/route'
import { parseTrackRoute, TrackRouteParams } from 'utils/route/trackRouteParser'
import { getTrackPageTitle, getTrackPageDescription } from 'utils/seo'

import StemsSEOHint from './components/StemsSEOHint'
import { OwnProps as DesktopTrackPageProps } from './components/desktop/TrackPage'
import { OwnProps as MobileTrackPageProps } from './components/mobile/TrackPage'
import { TRENDING_BADGE_LIMIT } from './store/sagas'

const getRemixParentTrackId = (track: Track | null) =>
  track?.remix_of?.tracks?.[0]?.parent_track_id

type OwnProps = {
  children:
    | ComponentType<MobileTrackPageProps>
    | ComponentType<DesktopTrackPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type TrackPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

type TrackPageProviderState = {
  pathname: string
  ownerHandle: string | null
  showDeleteConfirmation: boolean
  routeKey: ID
  source: string | undefined
}

class TrackPageProvider extends Component<
  TrackPageProviderProps,
  TrackPageProviderState
> {
  state: TrackPageProviderState = {
    pathname: this.props.pathname,
    ownerHandle: null,
    showDeleteConfirmation: false,
    routeKey: parseTrackRoute(this.props.pathname)?.trackId ?? 0,
    source: undefined
  }

  componentDidMount() {
    const params = parseTrackRoute(this.props.pathname)
    // Go to 404 if the track id isn't parsed correctly or if should redirect
    if (!params || (params.trackId && shouldRedirectTrack(params.trackId))) {
      this.props.goToRoute(NOT_FOUND_PAGE)
      return
    }

    this.fetchTracks(params)
  }

  componentDidUpdate(prevProps: TrackPageProviderProps) {
    const {
      pathname,
      track,
      status,
      refetchTracksLinup,
      user,
      trackPermalink
    } = this.props
    if (status === Status.ERROR) {
      this.props.goToRoute(NOT_FOUND_PAGE)
    }
    if (user && user.is_deactivated) {
      this.goToProfilePage(user.handle)
    }
    if (!isMobile()) {
      // On componentDidUpdate we try to reparse the URL because if you’re on a track page
      // and go to another track page, the component doesn’t remount but we need to
      // trigger a re-fetch based on the URL. On mobile, separate page provider components are
      // used so this is a non-issue.
      if (pathname !== this.state.pathname) {
        const params = parseTrackRoute(pathname)
        if (params) {
          this.setState({ pathname })
          this.fetchTracks(params)
        }
      }
    }

    // Set the lineup source in state once it's set in redux
    if (
      !this.state.source &&
      this.state.routeKey === this.props.track?.track_id
    ) {
      this.setState({ source: this.props.source })
    }

    // If the remix of this track changed and we have
    // already fetched the track, refetch the entire lineup
    // because the remix parent track needs to be retrieved
    if (
      prevProps.track &&
      prevProps.track.track_id &&
      track &&
      track.track_id &&
      getRemixParentTrackId(prevProps.track) !== getRemixParentTrackId(track)
    ) {
      refetchTracksLinup()
    }

    if (track) {
      const params = parseTrackRoute(pathname)
      if (params) {
        // Check if we are coming from a non-canonical route and replace route if necessary.
        const { slug, handle } = params
        if (slug === null || handle === null) {
          if (track.permalink) {
            this.props.replaceRoute(track.permalink)
          }
        } else {
          // Reroute to the most recent permalink if necessary in case user edits the track
          // name, which changes the permalink
          if (
            pathname === this.state.pathname &&
            prevProps.track?.track_id === track?.track_id &&
            trackPermalink &&
            trackPermalink !== pathname
          ) {
            // The path is going to change but don't re-fetch as we already have the track
            this.setState({ pathname: trackPermalink })
            this.props.replaceRoute(trackPermalink)
          }
        }
      }
    }
  }

  componentWillUnmount() {
    if (!isMobile()) {
      // Don't reset on mobile because there are two
      // track pages mounted at a time due to animations.
      this.props.resetTrackPage()
    }
  }

  fetchTracks = (params: NonNullable<TrackRouteParams>) => {
    const { track } = this.props
    const { slug, trackId, handle } = params

    // Go to feed if the track is deleted
    if (track && track.track_id === trackId) {
      if (track._marked_deleted) {
        this.props.goToRoute(FEED_PAGE)
        return
      }
    }
    this.props.reset()
    if (trackId) {
      this.props.setTrackId(trackId)
    }
    if (slug && handle) {
      this.props.setTrackPermalink(`/${handle}/${slug}`)
    }
    this.props.fetchTrack(trackId, slug || '', handle || '', !!(slug && handle))
    if (handle) {
      this.setState({ ownerHandle: handle })
    }
  }

  onHeroPlay = (heroPlaying: boolean) => {
    const {
      play,
      pause,
      currentQueueItem,
      moreByArtist: { entries },
      record
    } = this.props
    if (!entries || !entries[0]) return
    const track = entries[0]

    if (heroPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${track.id}`,
          source: PlaybackSource.TRACK_PAGE
        })
      )
    } else if (
      currentQueueItem.uid !== track.uid &&
      currentQueueItem.track &&
      currentQueueItem.track.track_id === track.id
    ) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${track.id}`,
          source: PlaybackSource.TRACK_PAGE
        })
      )
    } else if (track) {
      play(track.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${track.id}`,
          source: PlaybackSource.TRACK_PAGE
        })
      )
    }
  }

  onMoreByArtistTracksPlay = (uid?: string) => {
    const { play, recordPlayMoreByArtist } = this.props
    play(uid)
    if (uid) {
      const trackId = Uid.fromString(uid).id
      recordPlayMoreByArtist(trackId)
    }
  }

  onHeroRepost = (isReposted: boolean, trackId: ID) => {
    const { repostTrack, undoRepostTrack } = this.props
    if (!isReposted) {
      repostTrack(trackId)
    } else {
      undoRepostTrack(trackId)
    }
  }

  onHeroShare = (trackId: ID) => {
    const { shareTrack } = this.props
    shareTrack(trackId)
  }

  onSaveTrack = (isSaved: boolean, trackId: ID) => {
    const { saveTrack, unsaveTrack } = this.props
    if (isSaved) {
      unsaveTrack(trackId)
    } else {
      saveTrack(trackId)
    }
  }

  onFollow = () => {
    const { onFollow, track } = this.props
    if (track) onFollow(track.owner_id)
  }

  onUnfollow = () => {
    const { onUnfollow, onConfirmUnfollow, track } = this.props
    if (track) {
      if (this.props.isMobile) {
        onConfirmUnfollow(track.owner_id)
      } else {
        onUnfollow(track.owner_id)
      }
    }
  }

  goToProfilePage = (handle: string) => {
    this.props.goToRoute(profilePage(handle))
  }

  goToSearchResultsPage = (tag: string) => {
    this.props.goToRoute(searchResultsPage(tag))
    this.props.recordTagClick(tag.replace('#', ''))
  }

  goToParentRemixesPage = () => {
    const { goToRemixesOfParentPage, track } = this.props
    const parentTrackId = getRemixParentTrackId(track)
    if (parentTrackId) {
      goToRemixesOfParentPage(parentTrackId)
    }
  }

  goToAllRemixesPage = () => {
    const { track } = this.props
    if (track) {
      this.props.goToRoute(trackRemixesPage(track.permalink))
    }
  }

  goToFavoritesPage = (trackId: ID) => {
    this.props.setFavoriteTrackId(trackId)
    this.props.goToRoute(FAVORITING_USERS_ROUTE)
  }

  goToRepostsPage = (trackId: ID) => {
    this.props.setRepostTrackId(trackId)
    this.props.goToRoute(REPOSTING_USERS_ROUTE)
  }

  onClickReposts = () => {
    this.props.track && this.props.setRepostUsers(this.props.track.track_id)
    this.props.setModalVisibility()
  }

  onClickFavorites = () => {
    this.props.track && this.props.setFavoriteUsers(this.props.track.track_id)
    this.props.setModalVisibility()
  }

  render() {
    const {
      track,
      remixParentTrack,
      user,
      trackRank,
      moreByArtist,
      currentQueueItem,
      playing,
      buffering,
      userId,
      pause,
      downloadTrack,
      onExternalLinkClick
    } = this.props
    const heroPlaying =
      playing &&
      !!track &&
      !!currentQueueItem.track &&
      currentQueueItem.track.track_id === track.track_id
    const badge =
      trackRank.year && trackRank.year <= TRENDING_BADGE_LIMIT
        ? `#${trackRank.year} This Year`
        : trackRank.month && trackRank.month <= TRENDING_BADGE_LIMIT
        ? `#${trackRank.month} This Month`
        : trackRank.week && trackRank.week <= TRENDING_BADGE_LIMIT
        ? `#${trackRank.week} This Week`
        : null

    const desktopProps = {
      // Follow Props
      onFollow: this.onFollow,
      onUnfollow: this.onUnfollow,
      makePublic: this.props.makeTrackPublic,
      onClickReposts: this.onClickReposts,
      onClickFavorites: this.onClickFavorites
    }

    const title = getTrackPageTitle({
      title: track ? track.title : '',
      handle: user ? user.handle : ''
    })

    const releaseDate = track ? track.release_date || track.created_at : ''
    const description = getTrackPageDescription({
      releaseDate: releaseDate ? formatDate(releaseDate) : '',
      description: track?.description ?? '',
      mood: track?.mood ?? '',
      genre: track ? getCanonicalName(track.genre) : '',
      duration: track ? formatSeconds(track.duration) : '',
      tags: track ? (track.tags || '').split(',').filter(Boolean) : []
    })
    const canonicalUrl = user && track ? fullTrackPage(track.permalink) : ''

    // If the track has a remix parent and it's not deleted and the original's owner is not deactivated.
    const hasValidRemixParent =
      !!getRemixParentTrackId(track) &&
      !!remixParentTrack &&
      remixParentTrack.is_delete === false &&
      !remixParentTrack.user?.is_deactivated

    if ((track?.is_delete || track?._marked_deleted) && user) {
      // Track has not been blocked and is content-available, meaning the owner
      // deleted themselves via transaction.
      const deletedByArtist = !track._blocked && track.is_available

      return (
        <DeletedPage
          title={title}
          description={description}
          canonicalUrl={canonicalUrl}
          playable={{ metadata: track, type: PlayableType.TRACK }}
          user={user}
          deletedByArtist={deletedByArtist}
        />
      )
    }

    const childProps = {
      title,
      description,
      canonicalUrl,
      heroTrack: track,
      hasValidRemixParent,
      user,
      heroPlaying,
      userId,
      badge,
      onHeroPlay: this.onHeroPlay,
      goToProfilePage: this.goToProfilePage,
      goToSearchResultsPage: this.goToSearchResultsPage,
      goToAllRemixesPage: this.goToAllRemixesPage,
      goToParentRemixesPage: this.goToParentRemixesPage,
      onHeroRepost: this.onHeroRepost,
      onHeroShare: this.onHeroShare,
      onSaveTrack: this.onSaveTrack,
      onDownloadTrack: downloadTrack,
      onClickMobileOverflow: this.props.clickOverflow,
      onConfirmUnfollow: this.props.onConfirmUnfollow,
      goToFavoritesPage: this.goToFavoritesPage,
      goToRepostsPage: this.goToRepostsPage,

      // Tracks Lineup Props
      tracks: moreByArtist,
      currentQueueItem,
      isPlaying: playing,
      isBuffering: buffering,
      play: this.onMoreByArtistTracksPlay,
      pause,
      onExternalLinkClick
    }

    return (
      <>
        {!!track?._stems?.[0] && <StemsSEOHint />}
        <this.props.children
          key={this.state.routeKey}
          {...childProps}
          {...desktopProps}
        />
      </>
    )
  }
}

const REDIRECT_TRACK_ID_RANGE = [416972, 418372]
const shouldRedirectTrack = (trackId: ID) =>
  trackId >= REDIRECT_TRACK_ID_RANGE[0] && trackId <= REDIRECT_TRACK_ID_RANGE[1]

function makeMapStateToProps() {
  const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      source: getSourceSelector(state),
      track: getTrack(state),
      trackPermalink: getTrackPermalink(state),
      remixParentTrack: getRemixParentTrack(state),
      user: getUser(state),
      status: getStatus(state),
      moreByArtist: getMoreByArtistLineup(state),
      userId: getUserId(state),

      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      trackRank: getTrackRank(state),
      isMobile: isMobile(),
      pathname: getLocationPathname(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchTrack: (
      trackId: number | null,
      slug: string,
      ownerHandle: string,
      canBeUnlisted: boolean
    ) =>
      dispatch(
        trackPageActions.fetchTrack(trackId, slug, ownerHandle, canBeUnlisted)
      ),
    setTrackId: (trackId: number) =>
      dispatch(trackPageActions.setTrackId(trackId)),
    setTrackPermalink: (permalink: string) =>
      dispatch(trackPageActions.setTrackPermalink(permalink)),
    resetTrackPage: () => dispatch(trackPageActions.resetTrackPage()),
    makeTrackPublic: (trackId: ID) =>
      dispatch(trackPageActions.makeTrackPublic(trackId)),

    goToRoute: (route: string) => dispatch(pushRoute(route)),
    replaceRoute: (route: string) => dispatch(replace(route)),
    reset: (source?: string) => dispatch(tracksActions.reset(source)),
    play: (uid?: string) => dispatch(tracksActions.play(uid)),
    recordPlayMoreByArtist: (trackId: ID) => {
      const trackEvent: TrackEvent = make(Name.TRACK_PAGE_PLAY_MORE, {
        id: trackId
      })
      dispatch(trackEvent)
    },
    pause: () => dispatch(tracksActions.pause()),
    shareTrack: (trackId: ID) =>
      dispatch(
        requestOpenShareModal({
          type: 'track',
          trackId,
          source: ShareSource.PAGE
        })
      ),
    saveTrack: (trackId: ID) =>
      dispatch(
        socialTracksActions.saveTrack(trackId, FavoriteSource.TRACK_PAGE)
      ),
    unsaveTrack: (trackId: ID) =>
      dispatch(
        socialTracksActions.unsaveTrack(trackId, FavoriteSource.TRACK_PAGE)
      ),
    deleteTrack: (trackId: ID) =>
      dispatch(cacheTrackActions.deleteTrack(trackId)),
    repostTrack: (trackId: ID) =>
      dispatch(
        socialTracksActions.repostTrack(trackId, RepostSource.TRACK_PAGE)
      ),
    undoRepostTrack: (trackId: ID) =>
      dispatch(
        socialTracksActions.undoRepostTrack(trackId, RepostSource.TRACK_PAGE)
      ),
    editTrack: (trackId: ID, formFields: any) =>
      dispatch(cacheTrackActions.editTrack(trackId, formFields)),
    onFollow: (userId: ID) =>
      dispatch(socialUsersActions.followUser(userId, FollowSource.TRACK_PAGE)),
    onUnfollow: (userId: ID) =>
      dispatch(
        socialUsersActions.unfollowUser(userId, FollowSource.TRACK_PAGE)
      ),
    onConfirmUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId)),
    downloadTrack: (
      trackId: ID,
      cid: CID,
      creatorNodeEndpoints: string,
      category?: string,
      parentTrackId?: ID
    ) => {
      dispatch(
        socialTracksActions.downloadTrack(
          trackId,
          cid,
          creatorNodeEndpoints,
          category
        )
      )
      const trackEvent: TrackEvent = make(Name.TRACK_PAGE_DOWNLOAD, {
        id: trackId,
        category,
        parent_track_id: parentTrackId
      })
      dispatch(trackEvent)
    },
    clickOverflow: (trackId: ID, overflowActions: OverflowAction[]) =>
      dispatch(
        open({ source: OverflowSource.TRACKS, id: trackId, overflowActions })
      ),
    setRepostTrackId: (trackId: ID) =>
      dispatch(setRepost(trackId, RepostType.TRACK)),
    setFavoriteTrackId: (trackId: ID) =>
      dispatch(setFavorite(trackId, FavoriteType.TRACK)),
    onExternalLinkClick: (event: any) => {
      const trackEvent: TrackEvent = make(Name.LINK_CLICKING, {
        url: event.target.href,
        source: 'track page' as const
      })
      dispatch(trackEvent)
    },
    recordTagClick: (tag: string) => {
      const trackEvent: TrackEvent = make(Name.TAG_CLICKING, {
        tag,
        source: 'track page' as const
      })
      dispatch(trackEvent)
    },
    record: (event: TrackEvent) => dispatch(event),
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
    goToRemixesOfParentPage: (parentTrackId: ID) =>
      dispatch(trackPageActions.goToRemixesOfParentPage(parentTrackId)),
    refetchTracksLinup: () => dispatch(trackPageActions.refetchLineup())
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(TrackPageProvider)
