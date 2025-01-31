import { useCallback, useState } from 'react'

import { useLibraryCollections } from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'
import {
  CommonState,
  SavedPageTabs,
  savedPageSelectors,
  LibraryCategory
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconFilter } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { CollectionCard } from 'components/collection'
import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { emptyStateMessages } from '../emptyStateMessages'

import { EmptyTab } from './EmptyTab'
import styles from './SavedPage.module.css'
import { useTabContainerRef } from './hooks'

const { getCategory } = savedPageSelectors
const { TRENDING_PAGE } = route

const messages = {
  filterAlbums: 'Filter Albums'
}

export const AlbumsTabPage = () => {
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
