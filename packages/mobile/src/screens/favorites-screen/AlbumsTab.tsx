import { useState } from 'react'

import type { CommonState } from '@audius/common'
import { useProxySelector } from '@audius/common'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'

import { FilterInput } from './FilterInput'
import { getAccountCollections } from './selectors'

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const [filterValue, setFilterValue] = useState('')

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
        <EmptyTileCTA message={messages.emptyTabText} />
      ) : (
        <>
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
