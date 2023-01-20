import { useState } from 'react'

import type { CommonState } from '@audius/common'
import { useProxySelector, reachabilitySelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'

import { FilterInput } from './FilterInput'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { getAccountCollections } from './selectors'

const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const [filterValue, setFilterValue] = useState('')
  const isReachable = useSelector(getIsReachable)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const userAlbums = useProxySelector(
    (state: CommonState) =>
      getAccountCollections(state, filterValue).filter(
        (collection) => collection.is_album
      ),
    [filterValue]
  )

  return (
    <VirtualizedScrollView listKey='favorites-albums-view'>
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
            listKey='favorites-albums'
            scrollEnabled={false}
            collection={userAlbums}
            style={{ marginVertical: 12 }}
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}
