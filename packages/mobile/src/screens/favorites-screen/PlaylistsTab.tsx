import { useState } from 'react'

import { getAccountWithPlaylists } from 'audius-client/src/common/store/account/selectors'
import { Shadow } from 'react-native-shadow-2'

import Button, { ButtonType } from 'app/components/button'
import { CollectionList } from 'app/components/collection-list'
import { VirtualizedScrollView } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyTab } from './EmptyTab'
import { FilterInput } from './FilterInput'
import { ExtendedCollection } from './types'

const messages = {
  emptyTabText: "You haven't favorited any playlists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = ({ navigation }) => {
  const [filterValue, setFilterValue] = useState('')
  const user = useSelectorWeb(getAccountWithPlaylists)

  const matchesFilter = (playlist: ExtendedCollection) => {
    const matchValue = filterValue.toLowerCase()
    return (
      playlist.playlist_name.toLowerCase().indexOf(matchValue) > -1 ||
      playlist.ownerName.toLowerCase().indexOf(matchValue) > -1
    )
  }

  const userPlaylists = user?.playlists
    ?.filter(
      playlist =>
        !playlist.is_album &&
        playlist.ownerHandle !== user.handle &&
        matchesFilter(playlist)
    )
    .map(playlist => ({ ...playlist, user }))

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
      <Shadow
        offset={[0, 1]}
        containerViewStyle={{ alignSelf: 'center', marginVertical: 16 }}
        viewStyle={{ borderRadius: 4 }}
        distance={3}
        startColor='rgba(133,129,153,0.11)'
      >
        <Button
          title='Create a New Playlist'
          type={ButtonType.COMMON}
          onPress={() => {}}
          containerStyle={{ width: 256 }}
        />
      </Shadow>
      <CollectionList
        listKey='favorites-playlists'
        scrollEnabled={false}
        collection={userPlaylists ?? []}
      />
    </VirtualizedScrollView>
  )
}
