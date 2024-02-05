import { useContext } from 'react'

import {
  CommonState,
  ID,
  Kind,
  LibraryCategory,
  Lineup,
  QueueItem,
  SavedPageCollection,
  savedPageSelectors,
  SavedPageTabs,
  SavedPageTrack,
  Status,
  TrackRecord,
  UID,
  User
} from '@audius/common'
import {
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconPause,
  IconPlay
} from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import { useSelector } from 'react-redux'

import FilterInput from 'components/filter-input/FilterInput'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { dateSorter } from 'components/table'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import EmptyTable from 'components/tracks-table/EmptyTable'
import useTabs from 'hooks/useTabs/useTabs'
import { MainContentContext } from 'pages/MainContentContext'

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
  onClickSave: (record: TrackRecord) => void
  onClickRepost: (record: TrackRecord) => void
  onPlay: () => void
  onSortTracks: (sorters: any) => void
  onChangeTab: (tab: SavedPageTabs) => void
  allTracksFetched: boolean
  filterText: string
  initialOrder: UID[] | null
  currentTab: SavedPageTabs
  account: (User & { albums: SavedPageCollection[] }) | undefined
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
  account,
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
  onClickSave,
  onClickRepost,
  onSortTracks
}: SavedPageProps) => {
  const { mainContentRef } = useContext(MainContentContext)
  const initFetch = useSelector(getInitialFetchStatus)
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
    let [data, playingIndex] = getFilteredData(entries)
    if (!hasReachedEnd) {
      // Add in some empty rows to show user that more are loading in
      data = data.concat(new Array(5).fill({ kind: Kind.EMPTY }))
    }
    return [data, playingIndex]
  }

  const [dataSource, playingIndex] =
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
        className={styles.playAllButton}
        iconClassName={styles.playAllButtonIcon}
        textClassName={styles.playAllButtonText}
        type={ButtonType.PRIMARY_ALT}
        text={queuedAndPlaying ? 'PAUSE' : 'PLAY'}
        leftIcon={queuedAndPlaying ? <IconPause /> : <IconPlay />}
        onClick={onPlay}
      />
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
          fetchMoreTracks={fetchMoreTracks}
          isVirtualized
          key='favorites'
          loading={tracksLoading || initFetch}
          onClickFavorite={onClickSave}
          onClickRepost={onClickRepost}
          onClickRow={onClickRow}
          onSortTracks={allTracksFetched ? onSortTracks : onSortChange}
          playing={queuedAndPlaying}
          playingIndex={playingIndex}
          scrollRef={mainContentRef}
          useLocalSort={allTracksFetched}
          fetchBatchSize={50}
          userId={account ? account.user_id : 0}
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
