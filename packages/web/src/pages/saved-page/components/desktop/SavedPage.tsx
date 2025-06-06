import { useCallback } from 'react'

import {
  useCurrentUserId,
  useFavoriteTrack,
  useUnfavoriteTrack
} from '@audius/common/api'
import {
  Kind,
  Status,
  ID,
  UID,
  Lineup,
  FavoriteSource,
  Track
} from '@audius/common/models'
import {
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  SavedPageTrack,
  TrackRecord,
  QueueItem,
  CommonState
} from '@audius/common/store'
import {
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconPause,
  IconPlay,
  Button,
  IconLibrary
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import FilterInput from 'components/filter-input/FilterInput'
import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { dateSorter } from 'components/table'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import EmptyTable from 'components/tracks-table/EmptyTable'
import useTabs from 'hooks/useTabs/useTabs'
import { useMainContentRef } from 'pages/MainContentContext'

import { emptyStateMessages } from '../emptyStateMessages'

import { AlbumsTabPage } from './AlbumsTabPage'
import { LibraryCategorySelectionMenu } from './LibraryCategorySelectionMenu'
import { PlaylistsTabPage } from './PlaylistsTabPage'
import styles from './SavedPage.module.css'

const { getInitialFetchStatus, getCategory } = savedPageSelectors

const messages = {
  libraryHeader: 'Library',
  filterPlaceholder: 'Filter Tracks',
  emptyTracksBody: 'Once you have, this is where you’ll find them!',
  goToTrending: 'Go to Trending'
}

const tableColumns: TracksTableColumn[] = [
  'playButton',
  'trackName',
  'artistName',
  'releaseDate',
  'savedDate',
  'length',
  'plays',
  'reposts',
  'overflowActions'
]

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  onSortChange: (method: string, direction: string) => void
  hasReachedEnd: boolean
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (
    trackMetadatas: SavedPageTrack[]
  ) => [SavedPageTrack[], number]
  fetchMoreTracks: (offset?: number, limit?: number) => void
  onClickRow: (record: TrackRecord) => void
  onClickRepost: (record: TrackRecord) => void
  onPlay: () => void
  onSortTracks: (sorters: any) => void
  onChangeTab: (tab: SavedPageTabs) => void
  allTracksFetched: boolean
  filterText: string
  initialOrder: UID[] | null
  currentTab: SavedPageTabs
  tracks: Lineup<SavedPageTrack>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedTracks: () => void
  resetSavedTracks: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void
  goToRoute: (route: string) => void
  play: (uid?: UID) => void
  pause: () => void
  repostTrack: (trackId: ID) => void
  undoRepostTrack: (trackId: ID) => void
  saveTrack: (trackId: ID) => void
  unsaveTrack: (trackId: ID) => void
}

const SavedPage = ({
  title,
  description,
  tracks: { status, entries },
  goToRoute,
  playing,
  currentTab,
  isQueued,
  fetchMoreTracks,
  getFilteredData,
  onPlay,
  onFilterChange,
  onSortChange,
  allTracksFetched,
  hasReachedEnd,
  filterText,
  onChangeTab,
  onClickRow,
  onClickRepost,
  onSortTracks
}: SavedPageProps) => {
  const mainContentRef = useMainContentRef()
  const initFetch = useSelector(getInitialFetchStatus)
  const { data: currentUserId } = useCurrentUserId()

  const { mutate: favoriteTrack } = useFavoriteTrack()
  const { mutate: unfavoriteTrack } = useUnfavoriteTrack()
  const toggleSaveTrack = useCallback(
    (track: Track) => {
      if (track.has_current_user_saved) {
        unfavoriteTrack({
          trackId: track.track_id,
          source: FavoriteSource.LIBRARY_PAGE
        })
      } else {
        favoriteTrack({
          trackId: track.track_id,
          source: FavoriteSource.LIBRARY_PAGE
        })
      }
    },
    [favoriteTrack, unfavoriteTrack]
  )

  const emptyTracksHeader = useSelector((state: CommonState) => {
    const selectedCategory = getCategory(state, {
      currentTab: SavedPageTabs.TRACKS
    })
    if (selectedCategory === LibraryCategory.All) {
      return emptyStateMessages.emptyTrackAllHeader
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return emptyStateMessages.emptyTrackFavoritesHeader
    } else if (selectedCategory === LibraryCategory.Repost) {
      return emptyStateMessages.emptyTrackRepostsHeader
    } else {
      return emptyStateMessages.emptyTrackPurchasedHeader
    }
  })

  const getTracksTableData = (): [SavedPageTrack[], number] => {
    let [data, activeIndex] = getFilteredData(entries)
    if (!hasReachedEnd) {
      // Add in some empty rows to show user that more are loading in
      data = data.concat(new Array(5).fill({ kind: Kind.EMPTY }))
    }
    return [data, activeIndex]
  }

  const [dataSource, activeIndex] =
    status === Status.SUCCESS || entries.length
      ? getTracksTableData()
      : [[], -1]

  const isEmpty =
    entries.length === 0 ||
    !entries.some((entry: SavedPageTrack) => Boolean(entry.track_id))
  const tracksLoading =
    (status === Status.IDLE || status === Status.LOADING) && isEmpty
  const queuedAndPlaying = playing && isQueued

  // Setup play button
  const playButtonActive = currentTab === SavedPageTabs.TRACKS && !tracksLoading
  const playAllButton = (
    <div
      className={styles.playButtonContainer}
      style={{
        opacity: playButtonActive ? 1 : 0,
        pointerEvents: playButtonActive ? 'auto' : 'none'
      }}
    >
      <Button
        variant='primary'
        size='small'
        css={(theme) => ({ marginLeft: theme.spacing.xl })}
        iconLeft={queuedAndPlaying ? IconPause : IconPlay}
        onClick={onPlay}
      >
        {queuedAndPlaying ? 'Pause' : 'Play'}
      </Button>
    </div>
  )

  // Setup filter
  const filterActive = currentTab === SavedPageTabs.TRACKS
  const filter = (
    <div
      className={styles.filterContainer}
      style={{
        opacity: filterActive ? 1 : 0,
        pointerEvents: filterActive ? 'auto' : 'none'
      }}
    >
      <FilterInput
        placeholder={messages.filterPlaceholder}
        onChange={onFilterChange}
        value={filterText}
      />
    </div>
  )

  const { tabs, body } = useTabs({
    isMobile: false,
    didChangeTabsFrom: (_, to) => {
      onChangeTab(to as SavedPageTabs)
    },
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    tabs: [
      {
        icon: <IconNote />,
        text: SavedPageTabs.TRACKS,
        label: SavedPageTabs.TRACKS
      },
      {
        icon: <IconAlbum />,
        text: SavedPageTabs.ALBUMS,
        label: SavedPageTabs.ALBUMS
      },
      {
        icon: <IconPlaylists />,
        text: SavedPageTabs.PLAYLISTS,
        label: SavedPageTabs.PLAYLISTS
      }
    ],
    elements: [
      isEmpty && !tracksLoading ? (
        <EmptyTable
          primaryText={emptyTracksHeader}
          secondaryText={messages.emptyTracksBody}
          buttonLabel={messages.goToTrending}
          onClick={() => goToRoute('/trending')}
        />
      ) : (
        <TracksTable
          columns={tableColumns}
          data={dataSource}
          defaultSorter={dateSorter('dateSaved')}
          fetchMore={fetchMoreTracks}
          isVirtualized
          key='favorites'
          loading={tracksLoading || initFetch}
          onClickFavorite={toggleSaveTrack}
          onClickRepost={onClickRepost}
          onClickRow={onClickRow}
          onSort={allTracksFetched ? onSortTracks : onSortChange}
          playing={queuedAndPlaying}
          activeIndex={activeIndex}
          scrollRef={mainContentRef}
          useLocalSort={allTracksFetched}
          fetchBatchSize={50}
          userId={currentUserId}
        />
      ),
      <AlbumsTabPage key='albums' />,
      <PlaylistsTabPage key='playlists' />
    ]
  })

  const headerBottomBar = (
    <div className={styles.headerBottomBarContainer}>
      {tabs}
      {filter}
    </div>
  )

  const header = (
    <Header
      icon={IconLibrary}
      primary={messages.libraryHeader}
      secondary={isEmpty ? null : playAllButton}
      rightDecorator={<LibraryCategorySelectionMenu currentTab={currentTab} />}
      containerStyles={styles.savedPageHeader}
      bottomBar={headerBottomBar}
    />
  )

  return (
    <Page
      title={title}
      description={description}
      contentClassName={styles.savedPageWrapper}
      header={header}
    >
      <div className={styles.bodyWrapper}>{body}</div>
    </Page>
  )
}

export default SavedPage
