import { useCallback, useState } from 'react'

import type { CommonState, UserCollection } from '@audius/common'
import { accountActions, useProxySelector } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView, Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import type { FavoritesTabScreenParamList } from '../app-screen/FavoritesTabScreen'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import { getAccountCollections } from './selectors'

const { fetchSavedPlaylists } = accountActions

const messages = {
  emptyTabText: "You haven't favorited any playlists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const [filterValue, setFilterValue] = useState('')
  const dispatch = useDispatch()

  const handleFetchSavedPlaylists = useCallback(() => {
    dispatch(fetchSavedPlaylists())
  }, [dispatch])

  useEffectOnce(handleFetchSavedPlaylists)

  const userPlaylists = useProxySelector(
    (state: CommonState) =>
      getAccountCollections(state, filterValue).filter(
        (collection) => !collection.is_album
      ),
    [filterValue]
  )

  const handleNavigateToNewPlaylist = useCallback(() => {
    navigation.push('CreatePlaylist')
  }, [navigation])

  return (
    <VirtualizedScrollView listKey='favorites-playlists-view'>
      {!userPlaylists?.length && !filterValue ? (
        <EmptyTab message={messages.emptyTabText} />
      ) : (
        <FilterInput
          value={filterValue}
          placeholder={messages.inputPlaceholder}
          onChangeText={setFilterValue}
        />
      )}
      <Button
        title='Create a New Playlist'
        variant='commonAlt'
        onPress={handleNavigateToNewPlaylist}
      />
      <CollectionList
        listKey='favorites-playlists'
        scrollEnabled={false}
        collection={(userPlaylists as UserCollection[]) ?? []}
      />
    </VirtualizedScrollView>
  )
}
