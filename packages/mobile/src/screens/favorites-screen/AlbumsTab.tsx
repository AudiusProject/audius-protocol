import { useState } from 'react'

import { accountActions, accountSelectors } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import type { ExtendedCollection } from './types'

const { getAccountWithAlbums } = accountSelectors
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
  const user = useSelector(getAccountWithAlbums)

  const matchesFilter = (playlist: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      playlist.playlist_name.toLowerCase().indexOf(matchValue) > -1 ||
      playlist.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userAlbums = user?.albums
    ?.filter(
      (playlist) =>
        playlist.is_album &&
        playlist.ownerHandle !== user.handle &&
        matchesFilter(playlist)
    )
    .map((playlist) => ({ ...playlist, user }))

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
            collection={userAlbums ?? []}
            style={{ marginVertical: 12 }}
          />
        </>
      )}
    </VirtualizedScrollView>
  )
}
