import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { useLibraryCollections } from '@audius/common/api'
import {
  useGatedContentAccessMap,
  useDebouncedCallback
} from '@audius/common/hooks'
import { statusIsNotFinalized, ID, UID, Lineup } from '@audius/common/models'
import {
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  SavedPageTrack,
  QueueItem,
  CommonState
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  IconAlbum,
  IconFilter,
  IconNote,
  IconPlaylists
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { CollectionCard } from 'components/collection'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/mobile/NavContext'
import TrackList from 'components/track/mobile/TrackList'
import { TrackItemAction } from 'components/track/mobile/TrackListItem'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import useTabs from 'hooks/useTabs/useTabs'

import { LibraryCategorySelectionMenu } from '../desktop/LibraryCategorySelectionMenu'
import { emptyStateMessages } from '../emptyStateMessages'

import NewCollectionButton from './NewCollectionButton'
import styles from './SavedPage.module.css'

const { TRENDING_PAGE } = route
const { getCategory } = savedPageSelectors

const emptyTabMessages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string | ReactNode
  onClick: () => void
}

const EmptyTab = (props: EmptyTabProps) => {
  const { message, onClick } = props
  return (
    <div className={styles.emptyTab}>
      <div className={styles.message}>{message}</div>
      <div className={styles.afterSaved}>{emptyTabMessages.afterSaved}</div>
      <Button variant='primary' onClick={onClick}>
        {emptyTabMessages.goToTrending}
      </Button>
    </div>
  )
}

const OFFSET_HEIGHT = 163
const SCROLL_HEIGHT = 88

/**
 * The Filter input should be hidden and displayed on scroll down.
 * The content container's height is set as the height plus the scroll
 * height so the search conatiner can be hidden under the top bar.
 * On component mount, the child component is scrolled to hide the input.
 */
const useOffsetScroll = () => {
  // Set the child's height base on it's content vs window height
  const contentRefCallback = useCallback(
    (node: HTMLDivElement, shouldReset?: boolean) => {
      if (node !== null) {
        if (shouldReset) {
          // TS complains about setting height value to null, but null is actually a valid value for this and is used to unset the height value altogether.
          // @ts-expect-error
          node.style.height = null
          return
        }
        const contentHeight = (window as any).innerHeight - OFFSET_HEIGHT
        const useContentHeight = contentHeight > node.scrollHeight
        node.style.height = useContentHeight
          ? `calc(${contentHeight}px + ${SCROLL_HEIGHT}px)`
          : `${node.scrollHeight + SCROLL_HEIGHT}px`
      }
    },
    []
  )

  return contentRefCallback
}

const useTabContainerRef = ({
  resultsLength,
  hasNoResults,
  currentTab,
  isFilterActive
}: {
  resultsLength: number | undefined
  hasNoResults: boolean
  currentTab: SavedPageTabs
  isFilterActive: boolean
}) => {
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false)

  const selectedCategory = useSelector((state: CommonState) =>
    getCategory(state, {
      currentTab
    })
  )
  const containerRef = useRef(null)
  const contentRefCallback = useOffsetScroll()

  useEffect(() => {
    // Scroll down past the filter input once the initial load is complete. If we don't do this, the scroll position won't end up in the right place.
    if (!hasCompletedInitialLoad && resultsLength && !isFilterActive) {
      window.scroll(0, SCROLL_HEIGHT)
      return
    }
    if (resultsLength === undefined && !isFilterActive) {
      setHasCompletedInitialLoad(false)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsLength, hasNoResults])

  useEffect(() => {
    // When the length of the results list changes, or we switch from loading state to empty state or list state (and vice versa), recalculate the height of the container.
    if (containerRef.current) {
      contentRefCallback(containerRef.current)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsLength, hasNoResults])

  useEffect(() => {
    // When the selected category (favorites/reposts/purchased/all) changes, recalculate the height of the container and scroll to the top.
    if (containerRef.current) {
      contentRefCallback(containerRef.current, true)
      window.scroll(0, SCROLL_HEIGHT)
    }
    // Disable exhaustive deps since the exclusions are deliberate - see above comment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory])

  return containerRef
}

const TracksLineup = ({
  tracks,
  goToTrending,
  onFilterChange,
  filterText,
  getFilteredData,
  playingUid,
  queuedAndPlaying,
  onTogglePlay
}: {
  tracks: Lineup<SavedPageTrack>
  goToTrending: () => void
  onFilterChange: (e: any) => void
  filterText: string
  getFilteredData: (trackMetadatas: any) => [SavedPageTrack[], number]
  playingUid: UID | null
  queuedAndPlaying: boolean
  onTogglePlay: (uid: UID, trackId: ID) => void
}) => {
  const [trackEntries] = getFilteredData(tracks.entries)
  const trackAccessMap = useGatedContentAccessMap(trackEntries)
  const trackList = trackEntries
    .filter((t) => t.track_id)
    .map((entry) => {
      const { isFetchingNFTAccess, hasStreamAccess } = trackAccessMap[
        entry.track_id
      ] ?? { isFetchingNFTAccess: false, hasStreamAccess: true }
      const isLocked = !isFetchingNFTAccess && !hasStreamAccess
      return {
        isLoading: false,
        isStreamGated: entry.is_stream_gated,
        isUnlisted: entry.is_unlisted,
        isSaved: entry.has_current_user_saved,
        isReposted: entry.has_current_user_reposted,
        isActive: playingUid === entry.uid,
        isPlaying: queuedAndPlaying && playingUid === entry.uid,
        artistName: entry.user.name,
        artistHandle: entry.user.handle,
        permalink: entry.permalink,
        trackTitle: entry.title,
        trackId: entry.track_id,
        uid: entry.uid,
        isDeleted: entry.is_delete || !!entry.user.is_deactivated,
        isLocked
      }
    })

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

  const contentRef = useTabContainerRef({
    resultsLength: trackList.length,
    hasNoResults: trackList.length === 0,
    currentTab: SavedPageTabs.TRACKS,
    isFilterActive: Boolean(filterText)
  })

  const isLoadingInitial = statusIsNotFinalized(tracks.status)
  const shouldHideFilterInput = isLoadingInitial && !filterText

  if (trackList.length === 0 && !statusIsNotFinalized(tracks.status)) {
    return (
      <div className={styles.tracksLineupContainer}>
        <EmptyTab
          message={
            <>
              {emptyTracksHeader}
              <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
            </>
          }
          onClick={goToTrending}
        />
      </div>
    )
  }

  return (
    <div className={styles.tracksLineupContainer}>
      <div ref={contentRef} className={styles.tabContainer}>
        {shouldHideFilterInput ? null : (
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
        )}
        {isLoadingInitial ? (
          <LoadingSpinner className={styles.spinner} />
        ) : null}
        {trackList.length > 0 && (
          <div className={styles.trackListContainer}>
            <TrackList
              tracks={trackList}
              showDivider
              showBorder
              togglePlay={onTogglePlay}
              trackItemAction={TrackItemAction.Overflow}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const AlbumCardLineup = () => {
  const selectedCategory = useSelector((state: CommonState) =>
    getCategory(state, { currentTab: SavedPageTabs.ALBUMS })
  )

  const {
    data: albums = [],
    fetchNextPage,
    hasNextPage,
    isPending,
    isFetchingNextPage
  } = useLibraryCollections({
    collectionType: 'albums',
    category: selectedCategory
  })

  const navigate = useNavigateToPage()

  const [filterText, setFilterText] = useState('')

  const emptyAlbumsHeader = useSelector((state: CommonState) => {
    const selectedCategory = getCategory(state, {
      currentTab: SavedPageTabs.ALBUMS
    })

    if (selectedCategory === LibraryCategory.All) {
      return emptyStateMessages.emptyAlbumAllHeader
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return emptyStateMessages.emptyAlbumFavoritesHeader
    } else {
      return emptyStateMessages.emptyAlbumRepostsHeader
    }
  })

  const handleGoToTrending = useCallback(
    () => navigate(TRENDING_PAGE),
    [navigate]
  )
  const debouncedSetFilter = useDebouncedCallback(
    (value: string) => {
      setFilterText(value)
    },
    [setFilterText],
    300
  )

  const handleFilterChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetFilter(value)
  }

  const albumCards = albums?.map((a) => {
    return <CollectionCard key={a.playlist_id} id={a.playlist_id} size='xs' />
  })

  const noSavedAlbums = !isPending && albums?.length === 0 && !filterText

  const isLoadingInitial = isPending && albums?.length === 0

  const shouldHideFilterInput = isLoadingInitial && !filterText

  const containerRef = useTabContainerRef({
    resultsLength: albums?.length,
    hasNoResults: noSavedAlbums,
    currentTab: SavedPageTabs.ALBUMS,
    isFilterActive: Boolean(filterText)
  })

  return (
    <div className={styles.cardLineupContainer}>
      {noSavedAlbums ? (
        <EmptyTab
          message={
            <>
              {emptyAlbumsHeader}
              <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
            </>
          }
          onClick={handleGoToTrending}
        />
      ) : (
        <div ref={containerRef} className={styles.tabContainer}>
          {shouldHideFilterInput ? null : (
            <div className={styles.searchContainer}>
              <div className={styles.searchInnerContainer}>
                <input
                  placeholder={messages.filterAlbums}
                  onChange={handleFilterChange}
                />
                <IconFilter className={styles.iconFilter} />
              </div>
            </div>
          )}
          {isLoadingInitial ? (
            <LoadingSpinner className={styles.spinner} />
          ) : null}
          {albums?.length > 0 ? (
            <div className={styles.cardsContainer}>
              <InfiniteCardLineup
                hasMore={hasNextPage}
                loadMore={fetchNextPage}
                cardsClassName={styles.cardLineup}
                cards={albumCards}
                isLoadingMore={isFetchingNextPage}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const PlaylistCardLineup = ({
  goToTrending,
  playlistUpdates,
  updatePlaylistLastViewedAt
}: {
  goToTrending: () => void
  onFilterChange: (e: any) => void
  playlistUpdates: number[]
  updatePlaylistLastViewedAt: (playlistId: number) => void
}) => {
  const selectedCategory = useSelector((state: CommonState) =>
    getCategory(state, { currentTab: SavedPageTabs.PLAYLISTS })
  )

  const {
    data: collections = [],
    fetchNextPage,
    hasNextPage,
    isPending,
    isFetchingNextPage
  } = useLibraryCollections({
    collectionType: 'playlists',
    category: selectedCategory
  })

  const [filterText, setFilterText] = useState('')

  const emptyPlaylistsHeader = useSelector((state: CommonState) => {
    const selectedCategory = getCategory(state, {
      currentTab: SavedPageTabs.PLAYLISTS
    })

    if (selectedCategory === LibraryCategory.All) {
      return emptyStateMessages.emptyPlaylistAllHeader
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return emptyStateMessages.emptyPlaylistFavoritesHeader
    } else {
      return emptyStateMessages.emptyPlaylistRepostsHeader
    }
  })
  const noSavedPlaylists =
    !isPending && collections?.length === 0 && !filterText

  const isLoadingInitial = isPending && collections?.length === 0

  const shouldHideFilterInput = isLoadingInitial && !filterText

  const playlistCards = collections?.map((p) => {
    return (
      <CollectionCard
        key={p.playlist_id}
        id={p.playlist_id}
        onClick={() => updatePlaylistLastViewedAt(p.playlist_id)}
        size='xs'
      />
    )
  })

  const containerRef = useTabContainerRef({
    resultsLength: collections?.length,
    hasNoResults: noSavedPlaylists,
    currentTab: SavedPageTabs.PLAYLISTS,
    isFilterActive: Boolean(filterText)
  })

  const debouncedSetFilter = useDebouncedCallback(
    (value: string) => {
      setFilterText(value)
    },
    [setFilterText],
    300
  )

  const handleFilterChange = ({
    target: { value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetFilter(value)
  }

  return (
    <div className={styles.cardLineupContainer}>
      {noSavedPlaylists ? (
        <>
          <EmptyTab
            message={
              <>
                {emptyPlaylistsHeader}
                <i className={cn('emoji', 'face-with-monocle', styles.emoji)} />
              </>
            }
            onClick={goToTrending}
          />
          <NewCollectionButton collectionType='playlist' />
        </>
      ) : (
        <div ref={containerRef} className={styles.tabContainer}>
          {shouldHideFilterInput ? null : (
            <div className={styles.searchContainer}>
              <div className={styles.searchInnerContainer}>
                <input
                  placeholder={messages.filterPlaylists}
                  onChange={handleFilterChange}
                />
                <IconFilter className={styles.iconFilter} />
              </div>
            </div>
          )}
          <NewCollectionButton collectionType='playlist' />
          {isLoadingInitial ? (
            <LoadingSpinner className={styles.spinner} />
          ) : null}
          {collections?.length > 0 ? (
            <div className={styles.cardsContainer}>
              <InfiniteCardLineup
                hasMore={hasNextPage}
                loadMore={fetchNextPage}
                cardsClassName={styles.cardLineup}
                cards={playlistCards}
                isLoadingMore={isFetchingNextPage}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

const messages = {
  filterTracks: 'Filter Tracks',
  filterAlbums: 'Filter Albums',
  filterPlaylists: 'Filter Playlists'
}

const tabHeaders = [
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
]

export type SavedPageProps = {
  title: string
  description: string
  onFilterChange: (e: any) => void
  isQueued: boolean
  playingUid: UID | null
  getFilteredData: (trackMetadatas: any) => [SavedPageTrack[], number]
  onTogglePlay: (uid: UID, trackId: ID) => void

  onPlay: () => void
  onSortTracks: (sorters: any) => void
  formatCardSecondaryText: (saves: number, tracks: number) => string
  filterText: string
  initialOrder: UID[] | null
  tracks: Lineup<SavedPageTrack>
  currentQueueItem: QueueItem
  playing: boolean
  buffering: boolean
  fetchSavedTracks: () => void
  resetSavedTracks: () => void
  updateLineupOrder: (updatedOrderIndices: UID[]) => void

  goToRoute: (route: string) => void
  repostTrack: (trackId: ID) => void
  undoRepostTrack: (trackId: ID) => void
  saveTrack: (trackId: ID) => void
  unsaveTrack: (trackId: ID) => void
  onClickRemove: any
  onReorderTracks: any
  playlistUpdates: number[]
  updatePlaylistLastViewedAt: (playlistId: number) => void
  currentTab: SavedPageTabs
  onChangeTab: (tab: SavedPageTabs) => void
}

const SavedPage = ({
  title,
  description,
  playingUid,
  tracks,
  goToRoute,
  playing,
  isQueued,
  onTogglePlay,
  getFilteredData,
  onFilterChange,
  filterText,
  playlistUpdates,
  updatePlaylistLastViewedAt,
  currentTab,
  onChangeTab
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
      onTogglePlay={onTogglePlay}
    />,
    <AlbumCardLineup key='albumLineup' />,
    <PlaylistCardLineup
      key='playlistLineup'
      goToTrending={goToTrending}
      onFilterChange={onFilterChange}
      playlistUpdates={playlistUpdates}
      updatePlaylistLastViewedAt={updatePlaylistLastViewedAt}
    />
  ]

  const handleTabClick = useCallback(
    (newTab: string) => {
      onChangeTab(newTab as SavedPageTabs)
    },
    [onChangeTab]
  )
  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements,
    initialScrollOffset: SCROLL_HEIGHT,
    onTabClick: handleTabClick
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={<span>{title}</span>}>
          <div className={styles.categoryMenuWrapper}>
            <LibraryCategorySelectionMenu
              currentTab={currentTab}
              variant='mobile'
            />
          </div>
        </Header>

        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [title, setHeader, tabs, currentTab])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={styles.mobilePageContainer}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default SavedPage
