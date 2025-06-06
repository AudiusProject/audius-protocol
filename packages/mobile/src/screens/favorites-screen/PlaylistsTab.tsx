import { useCallback, useState } from 'react'

import { CreatePlaylistSource } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import {
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  reachabilitySelectors
} from '@audius/common/store'
import Animated, { Layout } from 'react-native-reanimated'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'

import { LoadingMoreSpinner } from './LoadingMoreSpinner'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useLibraryCollections } from './useLibraryCollections'

const { getIsReachable } = reachabilitySelectors
const { getCategory } = savedPageSelectors

const messages = {
  emptyPlaylistFavoritesText: "You haven't favorited any playlists yet.",
  emptyPlaylistRepostsText: "You haven't reposted any playlists yet.",
  emptyPlaylistAllText:
    "You haven't favorited, reposted, or purchased any playlists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = () => {
  const [filterValue, setFilterValue] = useState('')
  const {
    collectionIds,
    loadNextPage,
    isPending,
    isFetchingNextPage,
    hasNextPage
  } = useLibraryCollections({
    filterValue,
    collectionType: 'playlists'
  })
  const isReachable = useSelector(getIsReachable)

  const handleEndReached = useCallback(() => {
    if (isReachable) {
      loadNextPage()
    }
  }, [isReachable, loadNextPage])

  const loadingSpinner = <LoadingMoreSpinner />
  const noItemsLoaded = !isPending && !collectionIds?.length && !filterValue

  const emptyTabText = useSelector((state: CommonState) => {
    const selectedCategory = getCategory(state, {
      currentTab: SavedPageTabs.PLAYLISTS
    })
    if (selectedCategory === LibraryCategory.All) {
      return messages.emptyPlaylistAllText
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return messages.emptyPlaylistFavoritesText
    } else {
      return messages.emptyPlaylistRepostsText
    }
  })

  return (
    <VirtualizedScrollView>
      {noItemsLoaded ? (
        !isReachable ? (
          <NoTracksPlaceholder />
        ) : (
          <EmptyTileCTA message={emptyTabText} />
        )
      ) : (
        <>
          <OfflineContentBanner />
          <FilterInput
            value={filterValue}
            placeholder={messages.inputPlaceholder}
            onChangeText={setFilterValue}
          />
          <Animated.View layout={Layout}>
            <CollectionList
              collectionType='playlist'
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              scrollEnabled={false}
              collectionIds={collectionIds}
              ListFooterComponent={
                isPending || (isFetchingNextPage && hasNextPage)
                  ? loadingSpinner
                  : null
              }
              showCreateCollectionTile={!!isReachable}
              createPlaylistSource={CreatePlaylistSource.LIBRARY_PAGE}
            />
          </Animated.View>
        </>
      )}
    </VirtualizedScrollView>
  )
}
