import { useState } from 'react'

import { reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'

import { FilterInput } from './FilterInput'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useCollectionScreenData } from './useCollectionScreenData'

const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const [filterValue, setFilterValue] = useState('')
  const { filteredCollections: userAlbums, collectionIdsToNumTracks } =
    useCollectionScreenData(filterValue, 'albums')
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  return (
    <VirtualizedScrollView>
      {!userAlbums?.length && !filterValue ? (
        isOfflineModeEnabled && !isReachable ? (
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
            scrollEnabled={false}
            collection={userAlbums}
            collectionIdsToNumTracks={collectionIdsToNumTracks}
            style={{ marginVertical: 12 }}
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}
