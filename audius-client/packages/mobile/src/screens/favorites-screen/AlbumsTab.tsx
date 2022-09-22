import { useState } from 'react'

import type { CommonState, UserCollection } from '@audius/common'
import { accountActions, useProxySelector } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import { getAccountCollections } from './selectors'

const { fetchSavedAlbums } = accountActions

const messages = {
  emptyTabText: "You haven't favorited any albums yet.",
  inputPlaceholder: 'Filter Albums'
}

export const AlbumsTab = () => {
  const dispatch = useDispatch()

  useEffectOnce(() => {
    dispatch(fetchSavedAlbums())
  })

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
        <EmptyTab message={messages.emptyTabText} />
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
            collection={(userAlbums as UserCollection[]) ?? []}
            style={{ marginVertical: 12 }}
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}
