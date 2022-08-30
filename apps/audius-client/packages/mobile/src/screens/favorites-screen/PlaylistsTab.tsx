import { useCallback, useState } from 'react'

import { accountActions, accountSelectors } from '@audius/common'
import { FAVORITES_PAGE } from 'audius-client/src/utils/route'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView, Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import type { FavoritesTabScreenParamList } from '../app-screen/FavoritesTabScreen'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import type { ExtendedCollection } from './types'

const { getAccountWithPlaylists } = accountSelectors
const { fetchSavedPlaylists } = accountActions

const messages = {
  emptyTabText: "You haven't favorited any playlists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const [filterValue, setFilterValue] = useState('')
  const user = useSelector(getAccountWithPlaylists)
  const dispatch = useDispatch()

  useEffectOnce(() => {
    dispatch(fetchSavedPlaylists())
  })

  const matchesFilter = (playlist: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      playlist.playlist_name.toLowerCase().indexOf(matchValue) > -1 ||
      playlist.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userPlaylists = user?.playlists
    ?.filter(
      (playlist) =>
        !playlist.is_album &&
        playlist.ownerHandle !== user.handle &&
        matchesFilter(playlist)
    )
    .map((playlist) => ({ ...playlist, user }))

  const handleNavigateToNewPlaylist = useCallback(() => {
    navigation.push({ native: { screen: 'CreatePlaylist' } })
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
        collection={userPlaylists ?? []}
        fromPage={FAVORITES_PAGE}
      />
    </VirtualizedScrollView>
  )
}
