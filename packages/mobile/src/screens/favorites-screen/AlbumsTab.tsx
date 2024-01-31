import { useCallback, useState } from 'react'

import type { CommonState } from '@audius/common/store'
import {
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  reachabilitySelectors
} from '@audius/common/store'

import { statusIsNotFinalized } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { FilterInput } from 'app/components/filter-input'

import { LoadingMoreSpinner } from './LoadingMoreSpinner'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useCollectionsScreenData } from './useCollectionsScreenData'

const { getCategory } = savedPageSelectors
const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyAlbumFavoritesText: "You haven't favorited any albums yet.",
  emptyAlbumRepostsText: "You haven't reposted any albums yet.",
  emptyAlbumPurchasedText: "You haven't purchased any albums yet.",
  emptyAlbumAllText:
    "You haven't favorited, reposted, or purchased any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const [filterValue, setFilterValue] = useState('')
  const {
    collectionIds: userAlbums,
    hasMore,
    fetchMore,
    status
  } = useCollectionsScreenData({
    filterValue,
    collectionType: 'albums'
  })
  const isReachable = useSelector(getIsReachable)

  const handleEndReached = useCallback(() => {
    if (isReachable && hasMore) {
      fetchMore()
    }
  }, [isReachable, hasMore, fetchMore])

  const emptyTabText = useSelector((state: CommonState) => {
    const selectedCategory = getCategory(state, {
      currentTab: SavedPageTabs.ALBUMS
    })
    if (selectedCategory === LibraryCategory.All) {
      return messages.emptyAlbumAllText
    } else if (selectedCategory === LibraryCategory.Favorite) {
      return messages.emptyAlbumFavoritesText
    } else if (selectedCategory === LibraryCategory.Purchase) {
      return messages.emptyAlbumPurchasedText
    } else {
      return messages.emptyAlbumRepostsText
    }
  })

  const loadingSpinner = <LoadingMoreSpinner />

  return (
    <VirtualizedScrollView>
      {!statusIsNotFinalized(status) && !userAlbums?.length && !filterValue ? (
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
          <CollectionList
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            scrollEnabled={false}
            collectionIds={userAlbums}
            ListFooterComponent={
              statusIsNotFinalized(status) && isReachable
                ? loadingSpinner
                : null
            }
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}
