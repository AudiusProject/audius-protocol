import { Text } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionList } from './CollectionList'
import { EmptyTab } from './EmptyTab'
import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't created any playlists yet"
}

export const PlaylistsTab = () => {
  const { profile, playlists } = useSelectorWeb(getProfile)

  if (!profile || !playlists) return null

  if (profile.playlist_count === 0) {
    return (
      <EmptyTab>
        <Text>{messages.emptyTabText}</Text>
      </EmptyTab>
    )
  }

  return (
    <CollectionList
      collection={playlists}
      profile={profile}
      emptyTabText={messages.emptyTabText}
    />
  )
}
