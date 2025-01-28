import { useState } from 'react'

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
import { useNavigate } from 'react-router-dom-v5-compat'

import { CollectionCard } from 'components/collection'
import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { emptyStateMessages } from '../emptyStateMessages'

import { EmptyTab } from './EmptyTab'
import NewCollectionButton from './NewCollectionButton'
import styles from './SavedPage.module.css'
import { useTabContainerRef } from './hooks'

const { getCategory } = savedPageSelectors

const messages = {
  filterPlaylists: 'Filter Playlists'
}

export const PlaylistsTabPage = () => {
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
    return <CollectionCard key={p.playlist_id} id={p.playlist_id} size='xs' />
  })

  const navigate = useNavigate()

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
            onClick={() => navigate(route.TRENDING_PAGE)}
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
