import { ReactNode, useCallback, useEffect, useContext } from 'react'

import { ID, UID, Name, Lineup, Status, User } from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconPlaylists } from 'assets/img/iconPlaylists.svg'
import {
  Tabs,
  SavedPageTrack,
  SavedPageCollection
} from 'common/store/pages/saved-page/types'
import { QueueItem } from 'common/store/queue/types'
import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import TrackList from 'components/track/mobile/TrackList'
import { TrackItemAction } from 'components/track/mobile/TrackListItem'
import useTabs from 'hooks/useTabs/useTabs'
import { make, useRecord } from 'store/analytics/actions'
import { albumPage, TRENDING_PAGE, playlistPage } from 'utils/route'

import NewPlaylistButton from './NewPlaylistButton'
import styles from './SavedPage.module.css'

const emptyTabMessages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string | ReactNode
  onClick: () => void
}

export const EmptyTab = (props: EmptyTabProps) => {
  return (
    <div className={styles.emptyTab}>
      <div className={styles.message}>{props.message}</div>
      <div className={styles.afterSaved}>{emptyTabMessages.afterSaved}</div>
      <Button
        type={ButtonType.PRIMARY_ALT}
        className={styles.emptyButton}
        textClassName={styles.emptyButtonText}
        text={emptyTabMessages.goToTrending}
        onClick={props.onClick}
      />
    </div>
  )
}

const OFFSET_HEIGHT = 142
const SCROLL_HEIGHT = 88

/**
 * The Filter input should be hidden and displayed on scroll down.
 * The content container's height is set as the height plus the scroll
 * height so the search conatiner can be hidden under the top bar.
 * On component mount, the child component is scrolled to hide the input.
 */
const useOffsetScroll = () => {
  // Set the child's height base on it's content vs window height
  const contentRefCallback = useCallback((node) => {
    if (node !== null) {
      const contentHeight = (window as any).innerHeight - OFFSET_HEIGHT
      const useContentHeight = contentHeight > node.scrollHeight
      node.style.height = useContentHeight
        ? `calc(${contentHeight}px + ${SCROLL_HEIGHT}px)`
        : `${node.scrollHeight + SCROLL_HEIGHT}px`
      window.scroll(0, SCROLL_HEIGHT)
    }
  }, [])

  return contentRefCallback
}

const TracksLineup = ({
  tracks,
  goToTrending,
  onFilterChange,
  filterText,
  getFilteredData,
  playingUid,
  queuedAndPlaying,
  onSave,
  onTogglePlay
}: {
  tracks: Lineup<SavedPageTrack>
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  getFilteredData: (trackMetadatas: any) => [SavedPageTrack[], number]
  playingUid: UID | null
  queuedAndPlaying: boolean
  onSave: (isSaved: boolean, trackId: ID) => void
  onTogglePlay: (uid: UID, trackId: ID) => void
}) => {
  const [trackEntries] = getFilteredData(tracks.entries)
  const trackList = trackEntries.map((entry) => ({
    isLoading: false,
    isSaved: entry.has_current_user_saved,
    isReposted: entry.has_current_user_reposted,
    isActive: playingUid === entry.uid,
    isPlaying: queuedAndPlaying && playingUid === entry.uid,
    artistName: entry.user.name,
    artistHandle: entry.user.handle,
    trackTitle: entry.title,
    trackId: entry.track_id,
    uid: entry.uid,
    isDeleted: entry.is_delete || !!entry.user.is_deactivated
  }))
  const contentRefCallback = useOffsetScroll()
  return (
    <div className={styles.tracksLineupContainer}>
      {tracks.status !== Status.LOADING ? (
        tracks.entries.length === 0 ? (
          <EmptyTab
            message={
              <>
                {messages.emptyTracks}
                <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
              </>
            }
            onClick={goToTrending}
          />
        ) : (
          <div ref={contentRefCallback} className={styles.tabContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchInnerContainer}>
                <input
                  placeholder={messages.filterTracks}
                  onChange={onFilterChange}
                  value={filterText}
                />
                <IconFilter className={styles.iconFilter} />
              </div>
            </div>
            {trackList.length > 0 && (
              <div className={styles.trackListContainer}>
                <TrackList
                  tracks={trackList}
                  showDivider
                  showBorder
                  onSave={onSave}
                  togglePlay={onTogglePlay}
                  trackItemAction={TrackItemAction.Save}
                />
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  )
}

const AlbumCardLineup = ({
  albums,
  goToTrending,
  onFilterChange,
  filterText,
  goToRoute,
  getFilteredAlbums,
  formatCardSecondaryText
}: {
  albums: SavedPageCollection[]
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  formatCardSecondaryText: (saves: number, tracks: number) => string
  getFilteredAlbums: (albums: SavedPageCollection[]) => SavedPageCollection[]
  goToRoute: (route: string) => void
}) => {
  const filteredAlbums = getFilteredAlbums(albums || [])
  const albumCards = filteredAlbums.map((album) => {
    return (
      <Card
        key={album.playlist_id}
        id={album.playlist_id}
        userId={album.playlist_owner_id}
        imageSize={album._cover_art_sizes}
        primaryText={album.playlist_name}
        secondaryText={formatCardSecondaryText(
          album.save_count,
          album.playlist_contents.track_ids.length
        )}
        onClick={() =>
          goToRoute(
            albumPage(album.ownerHandle, album.playlist_name, album.playlist_id)
          )
        }
      />
    )
  })

  const contentRefCallback = useOffsetScroll()

  return (
    <div className={styles.cardLineupContainer}>
      {albums.length === 0 ? (
        <EmptyTab
          message={
            <>
              {messages.emptyAlbums}
              <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
            </>
          }
          onClick={goToTrending}
        />
      ) : (
        <div ref={contentRefCallback} className={styles.tabContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInnerContainer}>
              <input
                placeholder={messages.filterAlbums}
                onChange={onFilterChange}
                value={filterText}
              />
              <IconFilter className={styles.iconFilter} />
            </div>
          </div>
          {filteredAlbums.length > 0 && (
            <div className={styles.cardsContainer}>
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={albumCards}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PlaylistCardLineup = ({
  playlists,
  goToTrending,
  onFilterChange,
  filterText,
  goToRoute,
  getFilteredPlaylists,
  formatCardSecondaryText,
  playlistUpdates,
  updatePlaylistLastViewedAt
}: {
  playlists: SavedPageCollection[]
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  formatCardSecondaryText: (saves: number, tracks: number) => string
  getFilteredPlaylists: (
    playlists: SavedPageCollection[]
  ) => SavedPageCollection[]
  goToRoute: (route: string) => void
  playlistUpdates: number[]
  updatePlaylistLastViewedAt: (playlistId: number) => void
}) => {
  const record = useRecord()

  const filteredPlaylists = getFilteredPlaylists(playlists || [])
  const playlistCards = filteredPlaylists.map((playlist) => {
    const hasUpdate = playlistUpdates.includes(playlist.playlist_id)
    return (
      <Card
        key={playlist.playlist_id}
        id={playlist.playlist_id}
        userId={playlist.playlist_owner_id}
        imageSize={playlist._cover_art_sizes}
        primaryText={playlist.playlist_name}
        secondaryText={formatCardSecondaryText(
          playlist.save_count,
          playlist.playlist_contents.track_ids.length
        )}
        onClick={() => {
          goToRoute(
            playlistPage(
              playlist.ownerHandle,
              playlist.playlist_name,
              playlist.playlist_id
            )
          )
          updatePlaylistLastViewedAt(playlist.playlist_id)
          record(
            make(Name.PLAYLIST_LIBRARY_CLICKED, {
              playlistId: playlist.playlist_id,
              hasUpdate
            })
          )
        }}
        updateDot={hasUpdate}
      />
    )
  })

  const contentRefCallback = useOffsetScroll()

  return (
    <div className={styles.cardLineupContainer}>
      {playlists.length === 0 ? (
        <>
          <EmptyTab
            message={
              <>
                {messages.emptyPlaylists}
                <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
              </>
            }
            onClick={goToTrending}
          />
          <NewPlaylistButton />
        </>
      ) : (
        <div ref={contentRefCallback} className={styles.tabContainer}>
          <div className={styles.searchContainer}>
            <div className={styles.searchInnerContainer}>
              <input
                placeholder={messages.filterPlaylists}
                onChange={onFilterChange}
                value={filterText}
              />
              <IconFilter className={styles.iconFilter} />
            </div>
          </div>
          <NewPlaylistButton />
          {filteredPlaylists.length > 0 && (
            <div className={styles.cardsContainer}>
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={playlistCards}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const messages = {
  emptyTracks: "You haven't favorited any tracks yet.",
  emptyAlbums: "You haven't favorited any albums yet.",
  emptyPlaylists: "You haven't favorited any playlists yet.",
  filterTracks: 'Filter Tracks',
  filterAlbums: 'Filter Albums',
  filterPlaylists: 'Filter Playlists',
  tracks: 'Tracks',
  albums: 'Albums',
  playlists: 'Playlists'
}

const tabHeaders = [
  { icon: <IconNote />, text: messages.tracks, label: Tabs.TRACKS },
  { icon: <IconAlbum />, text: messages.albums, label: Tabs.ALBUMS },
  { icon: <IconPlaylists />, text: messages.playlists, label: Tabs.PLAYLISTS }
]

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (trackMetadatas: any) => [SavedPageTrack[], number]
  onTogglePlay: (uid: UID, trackId: ID) => void

  onSave: (isSaved: boolean, trackId: ID) => void
  onPlay: () => void
  onSortTracks: (sorters: any) => void
  formatCardSecondaryText: (saves: number, tracks: number) => string
  filterText: string
  initialOrder: UID[] | null
  account:
    | (User & {
        albums: SavedPageCollection[]
        playlists: SavedPageCollection[]
      })
    | undefined
  tracks: Lineup<SavedPageTrack>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedTracks: () => void
  resetSavedTracks: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void
  getFilteredAlbums: (albums: SavedPageCollection[]) => SavedPageCollection[]
  getFilteredPlaylists: (
    playlists: SavedPageCollection[]
  ) => SavedPageCollection[]

  fetchSavedAlbums: () => void
  goToRoute: (route: string) => void
  repostTrack: (trackId: ID) => void
  undoRepostTrack: (trackId: ID) => void
  saveTrack: (trackId: ID) => void
  unsaveTrack: (trackId: ID) => void
  onClickRemove: any
  onReorderTracks: any
  playlistUpdates: number[]
  updatePlaylistLastViewedAt: (playlistId: number) => void
}

const SavedPage = ({
  title,
  description,
  account,
  playingUid,
  tracks,
  goToRoute,
  playing,
  isQueued,
  onTogglePlay,
  getFilteredData,
  getFilteredAlbums,
  getFilteredPlaylists,
  onFilterChange,
  filterText,
  formatCardSecondaryText,
  onSave,
  playlistUpdates,
  updatePlaylistLastViewedAt
}: SavedPageProps) => {
  useMainPageHeader()

  const queuedAndPlaying = playing && isQueued

  const goToTrending = () => goToRoute(TRENDING_PAGE)
  const elements = [
    <TracksLineup
      key='tracksLineup'
      tracks={tracks}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      getFilteredData={getFilteredData}
      playingUid={playingUid}
      queuedAndPlaying={queuedAndPlaying}
      onSave={onSave}
      onTogglePlay={onTogglePlay}
    />,
    <AlbumCardLineup
      key='albumLineup'
      getFilteredAlbums={getFilteredAlbums}
      albums={account ? account.albums : []}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      goToRoute={goToRoute}
      formatCardSecondaryText={formatCardSecondaryText}
    />,
    <PlaylistCardLineup
      key='playlistLineup'
      getFilteredPlaylists={getFilteredPlaylists}
      playlists={account ? account.playlists : []}
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      filterText={filterText}
      goToRoute={goToRoute}
      formatCardSecondaryText={formatCardSecondaryText}
      playlistUpdates={playlistUpdates}
      updatePlaylistLastViewedAt={updatePlaylistLastViewedAt}
    />
  ]
  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements,
    initialScrollOffset: SCROLL_HEIGHT
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={title} />
        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [title, setHeader, tabs])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={styles.mobilePageContainer}>
      {tracks.status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <div className={styles.tabContainer}>
          <div className={styles.pageContainer}>{body}</div>
        </div>
      )}
    </MobilePageContainer>
  )
}

export default SavedPage
