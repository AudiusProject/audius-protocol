import { ID, UID, Lineup, Status, User, FeatureFlags } from '@audius/common'
import { Button, ButtonType, IconPause, IconPlay } from '@audius/stems'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import {
  Tabs as ProfileTabs,
  TrackRecord,
  SavedPageTrack,
  SavedPageCollection
} from 'common/store/pages/saved-page/types'
import { QueueItem } from 'common/store/queue/types'
import Card from 'components/card/desktop/Card'
import FilterInput from 'components/filter-input/FilterInput'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import Page from 'components/page/Page'
import { TestTracksTable } from 'components/test-tracks-table'
import EmptyTable from 'components/tracks-table/EmptyTable'
import TracksTable from 'components/tracks-table/TracksTable'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import { useFlag } from 'hooks/useRemoteConfig'
import useTabs from 'hooks/useTabs/useTabs'
import { albumPage } from 'utils/route'

import styles from './SavedPage.module.css'

const messages = {
  filterPlaceholder: 'Filter Tracks'
}

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (
    trackMetadatas: SavedPageTrack[]
  ) => [SavedPageTrack[], number]
  onClickRow: (record: TrackRecord) => void
  onClickSave: (record: TrackRecord) => void
  onClickTrackName: (record: TrackRecord) => void
  onClickArtistName: (record: TrackRecord) => void
  onClickRepost: (record: TrackRecord) => void
  onPlay: () => void
  onSortTracks: (sorters: any) => void
  onChangeTab: (tab: ProfileTabs) => void
  formatCardSecondaryText: (saves: number, tracks: number) => string
  filterText: string
  initialOrder: UID[] | null
  currentTab: ProfileTabs
  account: (User & { albums: SavedPageCollection[] }) | undefined
  tracks: Lineup<SavedPageTrack>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedTracks: () => void
  resetSavedTracks: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void
  fetchSavedAlbums: () => void
  goToRoute: (route: string) => void
  play: (uid?: UID) => void
  pause: () => void
  repostTrack: (trackId: ID) => void
  undoRepostTrack: (trackId: ID) => void
  saveTrack: (trackId: ID) => void
  unsaveTrack: (trackId: ID) => void
  onClickRemove: any
  onReorderTracks: any
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
  getFilteredData,
  onPlay,
  onFilterChange,
  filterText,
  formatCardSecondaryText,
  onChangeTab,
  onClickRow,
  onClickSave,
  onClickTrackName,
  onClickArtistName,
  onClickRepost,
  onClickRemove,
  onSortTracks,
  onReorderTracks
}: SavedPageProps) => {
  const { isEnabled: isNewTablesEnabled } = useFlag(FeatureFlags.NEW_TABLES)
  const [dataSource, playingIndex] =
    status === Status.SUCCESS ? getFilteredData(entries) : [[], -1]
  const { isLoading: isLoadingAlbums, setDidLoad: setDidLoadAlbums } =
    useOrderedLoad(account ? account.albums.length : 0)
  const isEmpty = entries.length === 0
  const tracksLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued

  // Setup play button
  const playButtonActive = currentTab === ProfileTabs.TRACKS && !tracksLoading
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
  const filterActive = currentTab === ProfileTabs.TRACKS
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

  const cards = account
    ? account.albums.map((album, i) => {
        return (
          <Card
            index={i}
            isLoading={isLoadingAlbums(i)}
            setDidLoad={setDidLoadAlbums}
            key={album.playlist_id}
            id={album.playlist_id}
            userId={album.playlist_owner_id}
            imageSize={album._cover_art_sizes}
            size='medium'
            playlistName={album.playlist_name}
            playlistId={album.playlist_id}
            isPlaylist={false}
            isPublic={!album.is_private}
            handle={album.ownerHandle}
            primaryText={album.playlist_name}
            secondaryText={formatCardSecondaryText(
              album.save_count,
              album.playlist_contents.track_ids.length
            )}
            isReposted={album.has_current_user_reposted}
            isSaved={album.has_current_user_saved}
            cardCoverImageSizes={album._cover_art_sizes}
            onClick={() =>
              goToRoute(
                albumPage(
                  album.ownerHandle,
                  album.playlist_name,
                  album.playlist_id
                )
              )
            }
          />
        )
      })
    : []

  const { tabs, body } = useTabs({
    isMobile: false,
    didChangeTabsFrom: (_, to) => {
      onChangeTab(to as ProfileTabs)
    },
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    tabs: [
      {
        icon: <IconNote />,
        text: ProfileTabs.TRACKS,
        label: ProfileTabs.TRACKS
      },
      {
        icon: <IconAlbum />,
        text: ProfileTabs.ALBUMS,
        label: ProfileTabs.ALBUMS
      }
    ],
    elements: [
      isEmpty && !tracksLoading ? (
        <EmptyTable
          primaryText='You haven’t favorited any tracks yet.'
          secondaryText='Once you have, this is where you’ll find them!'
          buttonLabel='Go to Trending'
          onClick={() => goToRoute('/trending')}
        />
      ) : isNewTablesEnabled ? (
        <TestTracksTable
          key='favorites'
          userId={account ? account.user_id : 0}
          loading={tracksLoading}
          maxRowNum={10}
          playing={queuedAndPlaying}
          playingIndex={playingIndex}
          data={dataSource}
          onClickRow={onClickRow}
          onClickFavorite={onClickSave}
          onClickTrackName={onClickTrackName}
          onClickArtistName={onClickArtistName}
          onClickRepost={onClickRepost}
          onSortTracks={onSortTracks}
          // onReorderTracks={onReorderTracks}
          // onClickRemove={onClickRemove}
        />
      ) : (
        <div className={styles.tableWrapper}>
          <TracksTable
            key='favorites'
            userId={account ? account.user_id : 0}
            loading={tracksLoading}
            loadingRowsCount={account ? account.track_save_count : 0}
            playing={queuedAndPlaying}
            playingIndex={playingIndex}
            dataSource={dataSource}
            onClickRow={onClickRow}
            onClickFavorite={onClickSave}
            onClickTrackName={onClickTrackName}
            onClickArtistName={onClickArtistName}
            onClickRepost={onClickRepost}
            onClickRemove={onClickRemove}
            onSortTracks={onSortTracks}
            onReorderTracks={onReorderTracks}
          />
        </div>
      ),
      <div key='albums'>
        {account && account.albums.length > 0 ? (
          <CardLineup cards={cards} cardsClassName={styles.cardsContainer} />
        ) : (
          <EmptyTable
            primaryText='You haven’t favorited any albums yet.'
            secondaryText='Once you have, this is where you’ll find them!'
            buttonLabel='Go to Trending'
            onClick={() => goToRoute('/trending')}
          />
        )}
      </div>
    ]
  })

  const header = (
    <Header
      primary='Favorites'
      secondary={isEmpty ? null : playAllButton}
      rightDecorator={filter}
      containerStyles={styles.savedPageHeader}
      bottomBar={tabs}
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
