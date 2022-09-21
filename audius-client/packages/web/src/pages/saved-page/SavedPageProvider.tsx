import { ComponentType, PureComponent } from 'react'

import {
  ID,
  UID,
  RepostSource,
  FavoriteSource,
  PlaybackSource,
  Name,
  formatCount,
  accountSelectors,
  accountActions,
  lineupSelectors,
  notificationsSelectors,
  notificationsActions,
  savedPageTracksLineupActions as tracksActions,
  savedPageActions as saveActions,
  savedPageSelectors,
  SavedPageTabs as ProfileTabs,
  SavedPageTrack,
  TrackRecord,
  SavedPageCollection,
  tracksSocialActions as socialActions,
  playerSelectors,
  queueSelectors
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { debounce, isEqual } from 'lodash'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { TrackEvent, make } from 'common/store/analytics/actions'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import { SavedPageProps as DesktopSavedPageProps } from './components/desktop/SavedPage'
import { SavedPageProps as MobileSavedPageProps } from './components/mobile/SavedPage'
const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { getSavedTracksLineup, hasReachedEnd } = savedPageSelectors
const { updatePlaylistLastViewedAt } = notificationsActions
const { getPlaylistUpdates } = notificationsSelectors
const { makeGetTableMetadatas } = lineupSelectors

const { getAccountWithSavedPlaylistsAndAlbums } = accountSelectors

const messages = {
  title: 'Favorites',
  description: "View tracks that you've favorited"
}

const sortMethodMap: Record<string, string> = {
  title: 'title',
  artist: 'artist_name',
  created_at: 'release_date',
  dateListened: 'last_listen_date',
  dateSaved: 'added_date',
  time: 'length',
  plays: 'plays',
  repost_count: 'reposts'
}

type OwnProps = {
  children:
    | ComponentType<MobileSavedPageProps>
    | ComponentType<DesktopSavedPageProps>
}

type SavedPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

type SavedPageState = {
  currentTab: ProfileTabs
  filterText: string
  sortMethod: string
  sortDirection: string
  initialOrder: UID[] | null
  reordering?: UID[] | null
  allowReordering?: boolean
}

class SavedPage extends PureComponent<SavedPageProps, SavedPageState> {
  state: SavedPageState = {
    filterText: '',
    sortMethod: '',
    sortDirection: '',
    initialOrder: null,
    currentTab: ProfileTabs.TRACKS
  }

  handleFetchSavedTracks = debounce(() => {
    this.props.fetchSavedTracks(
      this.state.filterText,
      this.state.sortMethod,
      this.state.sortDirection
    )
  }, 300)

  handleFetchMoreSavedTracks = (offset: number, limit: number) => {
    if (this.props.hasReachedEnd) return
    const { filterText, sortMethod, sortDirection } = this.state
    this.props.fetchMoreSavedTracks(
      filterText,
      sortMethod,
      sortDirection,
      offset,
      limit
    )
  }

  componentDidMount() {
    this.props.fetchSavedTracks(
      this.state.filterText,
      this.state.sortMethod,
      this.state.sortDirection
    )
    this.props.fetchSavedAlbums()
    if (isMobile()) {
      this.props.fetchSavedPlaylists()
    }
  }

  componentWillUnmount() {
    this.props.resetSavedTracks()
  }

  componentDidUpdate() {
    const { tracks } = this.props

    if (!this.state.initialOrder && tracks.entries.length > 0) {
      const initialOrder = tracks.entries.map((track: any) => track.uid)
      this.setState({
        initialOrder,
        reordering: initialOrder
      })
    }
  }

  onFilterChange = (e: any) => {
    this.setState({ filterText: e.target.value }, this.handleFetchSavedTracks)
  }

  onSortChange = (method: string, direction: string) => {
    this.setState(
      { sortMethod: sortMethodMap[method] ?? '', sortDirection: direction },
      this.handleFetchSavedTracks
    )
  }

  formatMetadata = (trackMetadatas: SavedPageTrack[]) => {
    return trackMetadatas.map((entry, i) => ({
      ...entry,
      key: `${entry.title}_${entry.uid}_${i}`,
      name: entry.title,
      artist: entry.user?.name ?? '',
      handle: entry.user?.handle ?? '',
      date: entry.dateSaved,
      time: entry.duration,
      plays: entry.play_count
    }))
  }

  isQueued = () => {
    const { tracks, currentQueueItem } = this.props
    return tracks.entries.some(
      (entry: any) => currentQueueItem.uid === entry.uid
    )
  }

  getPlayingUid = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.uid
  }

  getPlayingId = () => {
    const { currentQueueItem } = this.props
    return currentQueueItem.track ? currentQueueItem.track.track_id : null
  }

  getFilteredData = (
    trackMetadatas: SavedPageTrack[]
  ): [SavedPageTrack[], number] => {
    const { tracks } = this.props
    const playingUid = this.getPlayingUid()
    const playingIndex = tracks.entries.findIndex(
      ({ uid }: any) => uid === playingUid
    )
    const filteredMetadata = this.formatMetadata(trackMetadatas)
    const filteredIndex =
      playingIndex > -1
        ? filteredMetadata.findIndex((metadata) => metadata.uid === playingUid)
        : playingIndex
    return [filteredMetadata, filteredIndex]
  }

  getFilteredAlbums = (
    albums: SavedPageCollection[]
  ): SavedPageCollection[] => {
    const filterText = this.state.filterText
    return albums.filter(
      (item: SavedPageCollection) =>
        item.playlist_name.toLowerCase().indexOf(filterText.toLowerCase()) >
          -1 ||
        item.ownerHandle.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    )
  }

  getFilteredPlaylists = (
    playlists: SavedPageCollection[]
  ): SavedPageCollection[] => {
    const filterText = this.state.filterText
    return playlists.filter(
      (item: SavedPageCollection) =>
        item.playlist_name.toLowerCase().indexOf(filterText.toLowerCase()) >
          -1 ||
        item.ownerHandle.toLowerCase().indexOf(filterText.toLowerCase()) > -1
    )
  }

  onClickRow = (trackRecord: TrackRecord) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === trackRecord.uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${trackRecord.track_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== trackRecord.uid) {
      play(trackRecord.uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${trackRecord.track_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${trackRecord.track_id}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onTogglePlay = (uid: string, trackId: ID) => {
    const { playing, play, pause, record } = this.props
    const playingUid = this.getPlayingUid()
    if (playing && playingUid === uid) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${trackId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (playingUid !== uid) {
      play(uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${trackId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${trackId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onClickSave = (record: TrackRecord) => {
    if (!record.has_current_user_saved) {
      this.props.saveTrack(record.track_id)
    } else {
      this.props.unsaveTrack(record.track_id)
    }
  }

  onSave = (isSaved: boolean, trackId: ID) => {
    if (!isSaved) {
      this.props.saveTrack(trackId)
    } else {
      this.props.unsaveTrack(trackId)
    }
  }

  onClickTrackName = (record: TrackRecord) => {
    this.props.goToRoute(record.permalink)
  }

  onClickArtistName = (record: TrackRecord) => {
    this.props.goToRoute(profilePage(record.handle))
  }

  onClickRepost = (record: TrackRecord) => {
    if (!record.has_current_user_reposted) {
      this.props.repostTrack(record.track_id)
    } else {
      this.props.undoRepostTrack(record.track_id)
    }
  }

  onPlay = () => {
    const {
      playing,
      play,
      pause,
      tracks: { entries },
      record
    } = this.props
    const isQueued = this.isQueued()
    const playingId = this.getPlayingId()
    if (playing && isQueued) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: `${playingId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (!playing && isQueued) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    } else if (entries.length > 0) {
      play(entries[0].uid)
      record(
        make(Name.PLAYBACK_PLAY, {
          id: `${playingId}`,
          source: PlaybackSource.FAVORITES_PAGE
        })
      )
    }
  }

  onSortTracks = (sorters: any) => {
    const { column, order } = sorters
    const {
      tracks: { entries }
    } = this.props
    // @ts-ignore
    const dataSource = this.formatMetadata(entries)
    let updatedOrder
    if (!column) {
      updatedOrder = this.state.initialOrder
      this.setState({ allowReordering: true })
    } else {
      updatedOrder = dataSource
        .sort((a, b) =>
          order === 'ascend' ? column.sorter(a, b) : column.sorter(b, a)
        )
        .map((metadata) => metadata.uid)
      this.setState({ allowReordering: false })
    }
    this.props.updateLineupOrder(updatedOrder!)
  }

  onChangeTab = (tab: ProfileTabs) => {
    this.setState({
      currentTab: tab
    })
  }

  formatCardSecondaryText = (saves: number, tracks: number) => {
    const savesText = saves === 1 ? 'Favorite' : 'Favorites'
    const tracksText = tracks === 1 ? 'Track' : 'Tracks'
    return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
  }

  render() {
    const isQueued = this.isQueued()
    const playingUid = this.getPlayingUid()

    const childProps = {
      title: messages.title,
      description: messages.description,

      // State
      currentTab: this.state.currentTab,
      filterText: this.state.filterText,
      initialOrder: this.state.initialOrder,
      reordering: this.state.reordering,
      allowReordering: this.state.allowReordering,

      // Props from AppState
      account: this.props.account,
      tracks: this.props.tracks,
      currentQueueItem: this.props.currentQueueItem,
      playing: this.props.playing,
      buffering: this.props.buffering,

      // Props from dispatch
      fetchSavedTracks: this.props.fetchSavedTracks,
      resetSavedTracks: this.props.resetSavedTracks,
      updateLineupOrder: this.props.updateLineupOrder,
      fetchSavedAlbums: this.props.fetchSavedAlbums,
      goToRoute: this.props.goToRoute,
      play: this.props.play,
      pause: this.props.pause,
      repostTrack: this.props.repostTrack,
      undoRepostTrack: this.props.undoRepostTrack,
      saveTrack: this.props.saveTrack,
      unsaveTrack: this.props.unsaveTrack,

      // Calculated Props
      isQueued,
      playingUid,

      // Methods
      onFilterChange: this.onFilterChange,
      onSortChange: this.onSortChange,
      formatMetadata: this.formatMetadata,
      getFilteredData: this.getFilteredData,
      onPlay: this.onPlay,
      onSortTracks: this.onSortTracks,
      onChangeTab: this.onChangeTab,
      formatCardSecondaryText: this.formatCardSecondaryText,
      onClickRemove: null
    }

    const mobileProps = {
      playlistUpdates: this.props.playlistUpdates,
      updatePlaylistLastViewedAt: this.props.updatePlaylistLastViewedAt,

      onSave: this.onSave,
      onTogglePlay: this.onTogglePlay,
      getFilteredAlbums: this.getFilteredAlbums,
      getFilteredPlaylists: this.getFilteredPlaylists
    }

    const desktopProps = {
      onClickRow: this.onClickRow,
      onClickSave: this.onClickSave,
      onClickTrackName: this.onClickTrackName,
      onClickArtistName: this.onClickArtistName,
      onClickRepost: this.onClickRepost,
      fetchMoreTracks: this.handleFetchMoreSavedTracks
    }

    return (
      // @ts-ignore
      <this.props.children {...childProps} {...mobileProps} {...desktopProps} />
    )
  }
}

type LineupData = ReturnType<ReturnType<typeof makeGetTableMetadatas>>
type AccountData = ReturnType<typeof getAccountWithSavedPlaylistsAndAlbums>
let tracksRef: LineupData
let accountRef: AccountData

function makeMapStateToProps() {
  const getLineupMetadatas = makeGetTableMetadatas(getSavedTracksLineup)
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    const tracks = getLineupMetadatas(state)
    const account = getAccountWithSavedPlaylistsAndAlbums(state)

    if (!isEqual(tracksRef, tracks)) {
      tracksRef = tracks
    }
    if (!isEqual(accountRef, account)) {
      accountRef = account
    }

    return {
      account: accountRef,
      tracks: tracksRef,
      currentQueueItem: getCurrentQueueItem(state),
      playing: getPlaying(state),
      buffering: getBuffering(state),
      playlistUpdates: getPlaylistUpdates(state),
      hasReachedEnd: hasReachedEnd(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetchSavedTracks: (
      query?: string,
      sortMethod?: string,
      sortDirection?: string,
      offset?: number,
      limit?: number
    ) =>
      dispatch(
        saveActions.fetchSaves(query, sortMethod, sortDirection, offset, limit)
      ),
    fetchMoreSavedTracks: (
      query?: string,
      sortMethod?: string,
      sortDirection?: string,
      offset?: number,
      limit?: number
    ) =>
      dispatch(
        saveActions.fetchMoreSaves(
          query,
          sortMethod,
          sortDirection,
          offset,
          limit
        )
      ),
    resetSavedTracks: () => dispatch(tracksActions.reset()),
    updateLineupOrder: (updatedOrderIndices: UID[]) =>
      dispatch(tracksActions.updateLineupOrder(updatedOrderIndices)),
    fetchSavedAlbums: () => dispatch(accountActions.fetchSavedAlbums()),
    fetchSavedPlaylists: () => dispatch(accountActions.fetchSavedPlaylists()),
    updatePlaylistLastViewedAt: (playlistId: number) =>
      dispatch(updatePlaylistLastViewedAt(playlistId)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    play: (uid?: UID) => dispatch(tracksActions.play(uid)),
    pause: () => dispatch(tracksActions.pause()),
    repostTrack: (trackId: ID) =>
      dispatch(socialActions.repostTrack(trackId, RepostSource.FAVORITES_PAGE)),
    undoRepostTrack: (trackId: ID) =>
      dispatch(
        socialActions.undoRepostTrack(trackId, RepostSource.FAVORITES_PAGE)
      ),
    saveTrack: (trackId: ID) =>
      dispatch(socialActions.saveTrack(trackId, FavoriteSource.FAVORITES_PAGE)),
    unsaveTrack: (trackId: ID) =>
      dispatch(
        socialActions.unsaveTrack(trackId, FavoriteSource.FAVORITES_PAGE)
      ),
    record: (event: TrackEvent) => dispatch(event)
  }
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SavedPage)
)
