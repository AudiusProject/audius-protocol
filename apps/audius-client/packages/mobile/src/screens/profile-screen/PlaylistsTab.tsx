import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { useEmptyProfileText } from './EmptyProfileTile'
const { getProfilePlaylists } = profilePageSelectors

export const PlaylistsTab = () => {
  const playlists = useSelector(getProfilePlaylists)

  const emptyListText = useEmptyProfileText('playlists')

  return (
    <CollectionList
      listKey='profile-playlists'
      collection={playlists}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}
