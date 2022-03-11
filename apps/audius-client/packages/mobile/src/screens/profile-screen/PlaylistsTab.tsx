import { getProfilePlaylists } from 'audius-client/src/common/store/pages/profile/selectors'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './EmptyProfileTile'

export const PlaylistsTab = () => {
  const playlists = useSelectorWeb(getProfilePlaylists)

  const emptyListText = useEmptyProfileText('playlists')

  return (
    <CollectionList
      listKey='profile-playlists'
      collection={playlists}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
    />
  )
}
