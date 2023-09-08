import { useCallback, useState } from 'react'

import { reachabilitySelectors, statusIsNotFinalized } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'

import { FilterInput } from './FilterInput'
import { LoadingMoreSpinner } from './LoadingMoreSpinner'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useCollectionsScreenData } from './useCollectionsScreenData'

const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
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

  const loadingSpinner = <LoadingMoreSpinner />

  return (
    <VirtualizedScrollView>
      {!statusIsNotFinalized(status) && !userAlbums?.length && !filterValue ? (
        !isReachable ? (
          <NoTracksPlaceholder />
        ) : (
          <EmptyTileCTA message={messages.emptyTabText} />
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
